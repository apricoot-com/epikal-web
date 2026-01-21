import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

/**
 * Company router
 * Handles company settings and branding
 */
export const companyRouter = router({
    /**
     * Get current company details
     */
    get: companyProcedure.query(async ({ ctx }) => {
        const company = await ctx.prisma.company.findUnique({
            where: { id: ctx.company.id },
            include: {
                branding: true,
                siteTemplate: true,
            },
        });

        if (!company) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Company not found",
            });
        }

        return company;
    }),

    /**
     * Update company settings
     * Requires OWNER or ADMIN role
     */
    update: companyProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100).optional(),
                legalName: z.string().max(200).optional().nullable(),
                timezone: z.string().optional(),
                currency: z.string().length(3).optional(),
                language: z.string().length(2).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check user role
            const membership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: ctx.company.id,
                    status: "ACTIVE",
                },
            });

            if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only owners and admins can update company settings",
                });
            }

            const updated = await ctx.prisma.company.update({
                where: { id: ctx.company.id },
                data: input,
            });

            return updated;
        }),

    /**
     * Get company branding
     */
    getBranding: companyProcedure.query(async ({ ctx }) => {
        const branding = await ctx.prisma.companyBranding.findUnique({
            where: { companyId: ctx.company.id },
        });

        return branding;
    }),

    /**
     * Update company branding
     * Requires OWNER or ADMIN role
     */
    updateBranding: companyProcedure
        .input(
            z.object({
                logoUrl: z.string().url().optional().nullable(),
                primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
                secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
                brandTone: z.string().max(100).optional().nullable(),
                brandKeywords: z.array(z.string()).optional(),
                brandRestrictions: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check user role
            const membership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: ctx.company.id,
                    status: "ACTIVE",
                },
            });

            if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only owners and admins can update branding",
                });
            }

            const branding = await ctx.prisma.companyBranding.upsert({
                where: { companyId: ctx.company.id },
                update: input,
                create: {
                    companyId: ctx.company.id,
                    ...input,
                },
            });

            return branding;
        }),
});
