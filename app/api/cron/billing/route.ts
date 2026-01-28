
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentService } from '@/lib/payments/service';
import { SUBSCRIPTION_PLANS } from '@/src/lib/subscription/plans';

export async function GET(req: Request) {
    // Basic auth check for cron execution (e.g. valid via Vercel Cron or manual key)
    // For now, open or check header if strictly needed. Vercel sets `Authorization` header.
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const now = new Date();

        // 1. Find companies due for renewal
        // Status: ACTIVE, TRIALING, or PAST_DUE (retry logic)
        // EndsAt: <= NOW
        const companiesToCharge = await prisma.company.findMany({
            where: {
                subscriptionStatus: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
                subscriptionEndsAt: { lte: now },
                paymentMethods: {
                    some: { isDefault: true } // Must have a payment method
                }
            },
            include: {
                paymentMethods: {
                    where: { isDefault: true },
                    take: 1
                }
            },
            take: 50 // Batch size
        });

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: [] as any[]
        };

        for (const company of companiesToCharge) {
            results.processed++;
            const plan = SUBSCRIPTION_PLANS[company.subscriptionTier];
            const amountInCents = plan.priceInCents || 0;

            // Skip free plans or no price defined
            if (amountInCents <= 0) {
                // Just extend for free? Or maybe it shouldn't be in this query if it's free.
                continue;
            }

            const paymentMethod = company.paymentMethods[0];
            if (!paymentMethod) continue; // Should be covered by query but safe check

            try {
                // Charge
                const provider = PaymentService.getProvider();
                const transaction = await provider.charge(
                    amountInCents,
                    company.currency || 'USD',
                    paymentMethod.token,
                    { companyId: company.id }
                );

                if (transaction.status === 'SUCCESS') {
                    // Success: Extend subscription
                    const newEndsAt = new Date();
                    newEndsAt.setDate(newEndsAt.getDate() + 30); // Monthly

                    await prisma.company.update({
                        where: { id: company.id },
                        data: {
                            subscriptionStatus: 'ACTIVE',
                            subscriptionEndsAt: newEndsAt
                        }
                    });
                    results.succeeded++;
                } else {
                    // Failure: Set to PAST_DUE
                    await prisma.company.update({
                        where: { id: company.id },
                        data: {
                            subscriptionStatus: 'PAST_DUE'
                        }
                    });
                    results.failed++;
                }
            } catch (error: any) {
                console.error(`Billing error for company ${company.id}:`, error);
                results.errors.push({ companyId: company.id, error: error.message });
                results.failed++;

                // Ensure marked as PAST_DUE on crash too?
                // Probably yes.
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${results.processed} companies.`,
            results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
