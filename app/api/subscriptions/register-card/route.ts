
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
    companyId: z.string().min(1, "Company ID is required"),
    cardData: z.object({
        number: z.string().min(13),
        expiryMonth: z.number().min(1).max(12),
        expiryYear: z.number().min(new Date().getFullYear()),
        cvv: z.string().min(3),
        holderName: z.string().min(1),
        email: z.string().email(),
        deviceSessionId: z.string().optional()
    })
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
        }

        const { companyId, cardData } = result.data;

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // 1. Tokenize Card via Payment Service
        const provider = PaymentService.getProvider();
        const paymentMethodResult = await provider.tokenizeCard(cardData);

        // 2. Save PaymentMethod to DB & Activate Trial
        await prisma.$transaction(async (tx) => {
            // Unset existing defaults
            await tx.paymentMethod.updateMany({
                where: { companyId, isDefault: true },
                data: { isDefault: false }
            });

            // Create new method
            await tx.paymentMethod.create({
                data: {
                    companyId,
                    gateway: paymentMethodResult.gateway,
                    token: paymentMethodResult.token,
                    last4: paymentMethodResult.last4,
                    brand: paymentMethodResult.brand,
                    expiryMonth: paymentMethodResult.expiryMonth,
                    expiryYear: paymentMethodResult.expiryYear,
                    isDefault: true
                }
            });

            // 3. Apply 14-Day Trial if applicable
            // Only if status is not already ACTIVE or TRIALING? 
            // User asked "se da un trial de 14 dias", implied on registration.
            // If re-registering card, maybe they assume trial continues?
            // I'll keep it safe: if not active, give trial.
            if (company.subscriptionStatus !== 'ACTIVE' && company.subscriptionStatus !== 'TRIALING') {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);

                await tx.company.update({
                    where: { id: companyId },
                    data: {
                        subscriptionStatus: 'TRIALING',
                        subscriptionEndsAt: trialEndsAt
                    }
                });
            }
        });

        return NextResponse.json({ success: true, message: 'Card registered and trial activated if applicable' });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
