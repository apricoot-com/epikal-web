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
                subscriptionTier: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true,
                customLimits: true,
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

        const limits = getCompanyLimits(
            company.subscriptionTier,
            company.customLimits as any
        );
        const plan = SUBSCRIPTION_PLANS[company.subscriptionTier];

        return {
            companyId: company.id,
            tier: company.subscriptionTier,
            status: company.subscriptionStatus,
            endsAt: company.subscriptionEndsAt,
            planName: plan.name,
            planDescription: plan.description,
            limits,
            paymentMethod: company.paymentMethods[0] || null,
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
                    subscriptionTier: true,
                    customLimits: true,
                },
            });

            if (!company) return { available: false };

            return {
                available: hasFeature(
                    company.subscriptionTier,
                    input.feature,
                    company.customLimits as any
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
