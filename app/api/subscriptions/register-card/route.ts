
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { SUBSCRIPTION_PLANS } from '@/src/lib/subscription/plans';

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

// Helper to map technical gateway errors to user-friendly messages
function getFriendlyErrorMessage(rawMessage: string): string {
    const msg = rawMessage.toLowerCase();

    if (msg.includes("numero de la tarjeta de credito no es valido") || msg.includes("credit card number is not valid")) {
        return "El número de tarjeta es incorrecto. Por favor verifícalo.";
    }
    if (msg.includes("fondos insuficientes") || msg.includes("insufficient funds")) {
        return "Fondos insuficientes. Por favor intenta con otra tarjeta.";
    }
    if (msg.includes("expiracion") || msg.includes("expiration")) {
        return "La fecha de expiración es inválida.";
    }
    if (msg.includes("seguridad") || msg.includes("security code")) {
        return "El código de seguridad (CVV) es incorrecto.";
    }
    if (msg.includes("transaccion rechazada") || msg.includes("declined")) {
        return "La transacción fue rechazada por el banco. Contacta a tu entidad financiera.";
    }

    // Return original if it looks like a manual friendly error we threw (like in reactivation)
    if (msg.includes("el cobro falló. por favor verifica")) {
        return rawMessage;
    }

    return "No pudimos procesar tu tarjeta. Por favor verifica los datos e intenta nuevamente.";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Datos inválidos. Revisa el formulario.', details: result.error.format() }, { status: 400 });
        }

        const { companyId, cardData } = result.data;

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return NextResponse.json({ error: 'Empresa no encontrada.' }, { status: 404 });
        }

        // 1. Tokenize Card via Payment Service
        const provider = PaymentService.getProvider();
        const paymentMethodResult = await provider.tokenizeCard(cardData);

        // 2. Save PaymentMethod to DB & Activate Trial
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

            // 3. Reactivation Logic
            // If CANCELED or PAST_DUE, we must CHARGE immediately to reactivate.
            if (company.subscriptionStatus === 'CANCELED' || company.subscriptionStatus === 'PAST_DUE') {
                const plan = SUBSCRIPTION_PLANS[company.subscriptionTier];
                const amountInCents = plan.priceInCents || 0;

                if (amountInCents > 0) {
                    // Charge the new token
                    // Note: paymentMethodResult returned a token we just created but haven't saved inside `tx` strictly yet?
                    // Actually we just did `tx.paymentMethod.create`.
                    // We can use `paymentMethodResult.token`.

                    const chargeResult = await provider.charge(
                        amountInCents,
                        company.currency || 'USD',
                        paymentMethodResult.token,
                        { companyId: company.id, description: `Reactivation of ${plan.name} Plan` }
                    );

                    // Create Transaction Record
                    await tx.transaction.create({
                        data: {
                            companyId: company.id,
                            amount: amountInCents / 100, // Store in cents or decimal? Schema says Decimal(10,2). 
                            // Wait, schema says Decimal. Is it expecting dollars or cents?
                            // Typically Decimal stores 29.00. 
                            // provider.charge takes cents usually for Stripe/PayU? 
                            // PayU provider uses `amount` as value.
                            // Let's assume schema expects major units if it is Decimal(10,2).
                            // If provider takes cents (2900), we should divide by 100 for DB if we want major units.
                            // Let's check schema again. `amount Decimal @db.Decimal(10, 2)`.
                            // If I store 2900 there, it fits, but it means $2900.
                            // I need to verify what `plans.ts` has. `priceInCents: 2900`. 
                            // So I should probably convert to major units for display/storage if that's the convention.
                            // Let's divide by 100.
                            currency: company.currency || 'USD',
                            status: chargeResult.status,
                            type: 'SUBSCRIPTION',
                            gatewayId: chargeResult.transactionId,
                            gatewayResponse: chargeResult.rawResponse as any
                        }
                    });

                    if (chargeResult.status !== 'SUCCESS') {
                        throw new Error("El cobro falló. Por favor verifica tu tarjeta o intenta con otra.");
                    }
                }

                // If charge successful (or free), extend subscription
                const newPeriodEnd = new Date();
                newPeriodEnd.setDate(newPeriodEnd.getDate() + 30); // 30 days valid from now

                await tx.company.update({
                    where: { id: companyId },
                    data: {
                        subscriptionStatus: 'ACTIVE',
                        subscriptionEndsAt: newPeriodEnd
                    }
                });
            }
            // If already TRIALING, keep it. 
            // If ACTIVE, keep it.
            // If brand new and somehow neither (default is ACTIVE), keep it.
        });

        return NextResponse.json({ success: true, message: 'Tarjeta registrada exitosamente.' });

    } catch (error: any) {
        console.error('Registration Error:', error);
        const friendlyMessage = getFriendlyErrorMessage(error.message || '');
        return NextResponse.json({ error: friendlyMessage }, { status: 500 });
    }
}
