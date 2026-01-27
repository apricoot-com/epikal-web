import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { canCreateResource } from "@/src/lib/subscription/limits";

/**
 * Location router
 * CRUD for company locations/branches
 */
export const locationRouter = router({
    /**
     * List all locations for the company
     */
    list: companyProcedure.query(async ({ ctx }) => {
        const locations = await ctx.prisma.location.findMany({
            where: { companyId: ctx.company.id },
            orderBy: { name: "asc" },
        });

        return locations;
    }),

    /**
     * Get a single location by ID
     */
    get: companyProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const location = await ctx.prisma.location.findFirst({
                where: {
                    id: input.id,
                    companyId: ctx.company.id,
                },
            });

            if (!location) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Location not found",
                });
            }

            return location;
        }),

    /**
     * Create a new location
     * Requires OWNER or ADMIN role
     */
    create: companyProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                address: z.string().max(300).optional(),
                city: z.string().max(100).optional(),
                country: z.string().max(100).optional(),
                phone: z.string().max(50).optional(),
                email: z.string().email().optional(),
                googleMapsUrl: z.string().url().optional().nullable(),
                latitude: z.number().optional().nullable(),
                longitude: z.number().optional().nullable(),
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
                    message: "Only owners and admins can create locations",
                });
            }

            // Check subscription limits
            const currentCount = await ctx.prisma.location.count({
                where: { companyId: ctx.company.id },
            });

            const limitCheck = canCreateResource(
                currentCount,
                ctx.company.subscriptionTier,
                "locations",
                ctx.company.customLimits as any
            );

            if (!limitCheck.allowed) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: limitCheck.reason || "Subscription limit reached",
                    cause: {
                        limitCheck,
                        upgradeUrl: "/dashboard/settings/billing",
                    },
                });
            }

            const location = await ctx.prisma.location.create({
                data: {
                    companyId: ctx.company.id,
                    ...input,
                },
            });

            return location;
        }),

    /**
     * Update a location
     * Requires OWNER or ADMIN role
     */
    update: companyProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                address: z.string().max(300).optional().nullable(),
                city: z.string().max(100).optional().nullable(),
                country: z.string().max(100).optional().nullable(),
                phone: z.string().max(50).optional().nullable(),
                email: z.string().email().optional().nullable(),
                googleMapsUrl: z.string().url().optional().nullable(),
                latitude: z.number().optional().nullable(),
                longitude: z.number().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

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
                    message: "Only owners and admins can update locations",
                });
            }

            // Verify location belongs to company
            const existing = await ctx.prisma.location.findFirst({
                where: {
                    id,
                    companyId: ctx.company.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Location not found",
                });
            }

            const location = await ctx.prisma.location.update({
                where: { id },
                data,
            });

            return location;
        }),

    /**
     * Delete a location
     * Requires OWNER or ADMIN role
     */
    delete: companyProcedure
        .input(z.object({ id: z.string() }))
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
                    message: "Only owners and admins can delete locations",
                });
            }

            // Verify location belongs to company
            const existing = await ctx.prisma.location.findFirst({
                where: {
                    id: input.id,
                    companyId: ctx.company.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Location not found",
                });
            }

            await ctx.prisma.location.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),
});
