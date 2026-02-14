import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { getCompanyLimits, hasFeature } from "@/src/lib/subscription/limits";
import { SUBSCRIPTION_PLANS } from "@/src/lib/subscription/plans";

export const subscriptionRouter = router({
    /**
     * Get current subscription info with usage stats
     */
    getMySubscription: companyProcedure.query(async ({ ctx }) => {
        const company = await ctx.prisma.company.findUnique({
            where: { id: ctx.company.id },
            select: {
                id: true,
                subscriptionData: true,
                paymentMethods: {
                    where: { isDefault: true },
                    take: 1,
                    select: {
                        brand: true,
                        last4: true,
                        expiryMonth: true,
                        expiryYear: true
                    }
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        status: true,
                        createdAt: true,
                        gatewayId: true
                    }
                },
                _count: {
                    select: {
                        locations: true,
                        services: true,
                        members: true,
                        resources: true,
                    },
                },
            },
        });

        if (!company) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Company not found",
            });
        }

        const subData = (company.subscriptionData as any) || {};
        const tier = subData.tier || "FREE";
        const status = subData.status || "ACTIVE";
        const endsAt = subData.endsAt || null;
        const customLimits = subData.customLimits || null;

        const limits = getCompanyLimits(
            tier,
            customLimits
        );
        const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];

        return {
            companyId: company.id,
            tier: tier,
            status: status,
            endsAt: endsAt,
            planName: plan.name,
            planDescription: plan.description,
            limits,
            paymentMethod: company.paymentMethods[0] || null,
            transactions: company.transactions,
            usage: {
                locations: company._count.locations,
                services: company._count.services,
                teamMembers: company._count.members,
                resources: company._count.resources,
            },
        };
    }),

    /**
     * Check if a specific feature is available
     */
    hasFeature: companyProcedure
        .input(
            z.object({
                feature: z.enum(["customDomain", "whiteLabel"]),
            })
        )
        .query(async ({ ctx, input }) => {
            const company = await ctx.prisma.company.findUnique({
                where: { id: ctx.company.id },
                select: {
                    subscriptionData: true,
                },
            });

            if (!company) return { available: false };

            const subData = (company.subscriptionData as any) || {};
            return {
                available: hasFeature(
                    subData.tier || "FREE",
                    input.feature,
                    subData.customLimits || null
                ),
            };
        }),

    /**
     * Get all available plans for upgrade comparison
     */
    getPlans: companyProcedure.query(() => {
        return Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => ({
            tier,
            ...plan,
        }));
    }),
});
