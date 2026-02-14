
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
        // We fetch those that have any subscription data and then filter in memory
        // for performance/simplicity given the JSON refactor.
        const allCompanies = await prisma.company.findMany({
            where: {
                subscriptionData: { not: Prisma.AnyNull },
                paymentMethods: {
                    some: { isDefault: true }
                }
            },
            include: {
                paymentMethods: {
                    where: { isDefault: true },
                    take: 1
                }
            }
        });

        const companiesToCharge = allCompanies.filter(company => {
            const subData = (company.subscriptionData as any) || {};
            const status = subData.status;
            const endsAt = subData.endsAt ? new Date(subData.endsAt) : null;

            const isEligibleStatus = ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(status);
            const isExpired = endsAt && endsAt <= now;

            return isEligibleStatus && isExpired;
        }).slice(0, 50);

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: [] as any[]
        };

        for (const company of companiesToCharge) {
            results.processed++;
            const subData = (company.subscriptionData as any) || {};
            const tier = subData.tier || 'FREE';
            const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
            const amountInCents = plan.priceInCents || 0;

            // Skip free plans or no price defined
            if (amountInCents <= 0) {
                continue;
            }

            const paymentMethod = company.paymentMethods[0];
            if (!paymentMethod) continue;

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
                            subscriptionData: {
                                ...subData,
                                status: 'ACTIVE',
                                endsAt: newEndsAt
                            }
                        }
                    });
                    results.succeeded++;
                } else {
                    // Failure: Set to PAST_DUE
                    await prisma.company.update({
                        where: { id: company.id },
                        data: {
                            subscriptionData: {
                                ...subData,
                                status: 'PAST_DUE'
                            }
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
