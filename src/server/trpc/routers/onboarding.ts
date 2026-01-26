import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";

/**
 * Onboarding router
 * Handles company creation and selection for new/returning users
 */
export const onboardingRouter = router({
    /**
     * Get user's onboarding status
     */
    getStatus: protectedProcedure.query(async ({ ctx }) => {
        // Get all companies the user belongs to
        const memberships = await ctx.prisma.userCompany.findMany({
            where: {
                userId: ctx.user.id,
                status: "ACTIVE",
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        });

        const companies = memberships.map((m) => ({
            id: m.company.id,
            name: m.company.name,
            slug: m.company.slug,
            role: m.role,
        }));

        // Check if user can create new companies
        // Block if user owns a past_due or suspended company
        const hasProblematicCompany = memberships.some(
            (m) =>
                m.role === "OWNER" &&
                (m.company.status === "SUSPENDED")
        );

        return {
            hasCompanies: companies.length > 0,
            companies,
            canCreateCompany: !hasProblematicCompany,
            activeCompanyId: ctx.company?.id ?? null,
            isSuperadmin: ctx.isSuperadmin,
        };
    }),

    /**
     * Create a new company
     */
    createCompany: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                slug: z
                    .string()
                    .min(3)
                    .max(50)
                    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if user can create companies
            const memberships = await ctx.prisma.userCompany.findMany({
                where: {
                    userId: ctx.user.id,
                    role: "OWNER",
                },
                include: {
                    company: true,
                },
            });

            const hasProblematicCompany = memberships.some(
                (m) => m.company.status === "SUSPENDED"
            );

            if (hasProblematicCompany) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No puedes crear empresas mientras tengas una suspendida",
                });
            }

            // Check slug uniqueness
            const existingSlug = await ctx.prisma.company.findUnique({
                where: { slug: input.slug },
            });

            if (existingSlug) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Este slug ya está en uso",
                });
            }

            // Create company with user as owner
            const company = await ctx.prisma.company.create({
                data: {
                    name: input.name,
                    slug: input.slug,
                    status: "ACTIVE", // or "TRIAL" if we implement trials
                    language: "es",
                    currency: "MXN",
                    timezone: "America/Mexico_City",
                },
            });

            // Create owner membership
            await ctx.prisma.userCompany.create({
                data: {
                    userId: ctx.user.id,
                    companyId: company.id,
                    role: "OWNER",
                    status: "ACTIVE",
                },
            });

            // Create default branding
            await ctx.prisma.companyBranding.create({
                data: {
                    companyId: company.id,
                    primaryColor: "#3B82F6",
                    secondaryColor: "#10B981",
                },
            });

            return company;
        }),

    /**
     * Set active company (stores preference)
     */
    setActiveCompany: protectedProcedure
        .input(z.object({ companyId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Verify user has access to this company
            const membership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: input.companyId,
                    status: "ACTIVE",
                },
                include: {
                    company: true,
                },
            });

            if (!membership) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No tienes acceso a esta empresa",
                });
            }

            // Return company info - cookie will be set client-side
            return {
                id: membership.company.id,
                name: membership.company.name,
                slug: membership.company.slug,
            };
        }),
});
