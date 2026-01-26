import { z } from "zod";
import { router, companyProcedure, publicProcedure } from "../init";
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
                description: z.string().optional().nullable(),
                siteTemplateId: z.string().optional(),
                siteSettings: z.record(z.string(), z.unknown()).optional(), // Allow flexible JSON input
                requiresBookingConfirmation: z.boolean().optional(),
                socialUrls: z
                    .object({
                        facebook: z.string().optional().nullable(),
                        instagram: z.string().optional().nullable(),
                        twitter: z.string().optional().nullable(),
                        linkedin: z.string().optional().nullable(),
                        tiktok: z.string().optional().nullable(),
                    })
                    .optional(),
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
                data: input as any,
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
                logoUrl: z.string().optional().nullable(),
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

    /**
     * Get public company data for booking wizard
     */
    getPublicData: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            const company = await ctx.prisma.company.findUnique({
                where: { slug: input.slug },
                include: {
                    branding: true,
                    services: {
                        where: { isPublic: true },
                        include: {
                            resources: {
                                include: { resource: true }
                            }
                        }
                    }
                }
            });

            if (!company) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
            }

            // Return stripped down unique data
            return {
                id: company.id,
                name: company.name,
                slug: company.slug,
                description: company.description,
                branding: company.branding,
                services: company.services
            };
        })
});
