import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

/**
 * Resource router
 * CRUD for company resources (professionals, physical spaces)
 */
export const resourceRouter = router({
    /**
     * List all resources for the company
     */
    list: companyProcedure
        .input(
            z.object({
                includeInactive: z.boolean().optional().default(false),
                type: z.enum(["PROFESSIONAL", "PHYSICAL"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const resources = await ctx.prisma.resource.findMany({
                where: {
                    companyId: ctx.company.id,
                    ...(input?.includeInactive ? {} : { status: "ACTIVE" }),
                    ...(input?.type ? { type: input.type } : {}),
                },
                include: {
                    location: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    services: {
                        include: {
                            service: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { name: "asc" },
            });
            return resources;
        }),

    /**
     * Get the resource linked to the current user
     */
    getMe: companyProcedure.query(async ({ ctx }) => {
        const resource = await ctx.prisma.resource.findFirst({
            where: {
                userId: ctx.user.id,
                companyId: ctx.company.id,
            },
            include: {
                location: true,
                services: {
                    include: {
                        service: true,
                    },
                },
                availability: {
                    orderBy: { dayOfWeek: "asc" },
                },
                blockouts: {
                    where: {
                        endTime: { gte: new Date() },
                    },
                    orderBy: { startTime: "asc" },
                },
            },
        });
        return resource;
    }),

    /**
     * Get a single resource by ID
     */
    get: companyProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const resource = await ctx.prisma.resource.findFirst({
                where: {
                    id: input.id,
                    companyId: ctx.company.id,
                },
                include: {
                    location: true,
                    services: {
                        include: {
                            service: true,
                        },
                    },
                    availability: {
                        orderBy: { dayOfWeek: 'asc' }
                    },
                    blockouts: {
                        where: {
                            endTime: { gte: new Date() } // Only future or current blockouts
                        },
                        orderBy: { startTime: 'asc' }
                    }
                },
            });

            if (!resource) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            return resource;
        }),

    /**
     * Create a new resource
     */
    create: companyProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                type: z.enum(["PROFESSIONAL", "PHYSICAL"]),
                description: z.string().max(500).optional(),
                bio: z.string().optional(),
                locationId: z.string().optional(),
                serviceIds: z.array(z.string()).optional(),
                image: z.string().optional(),
                userId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { serviceIds, ...data } = input;

            const resource = await ctx.prisma.resource.create({
                data: {
                    companyId: ctx.company.id,
                    ...data,
                },
            });

            // Assign services if provided
            if (serviceIds && serviceIds.length > 0) {
                await ctx.prisma.serviceResource.createMany({
                    data: serviceIds.map((serviceId) => ({
                        serviceId,
                        resourceId: resource.id,
                    })),
                });
            }

            return resource;
        }),

    /**
     * Update a resource
     */
    update: companyProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                description: z.string().max(500).optional().nullable(),
                bio: z.string().optional().nullable(),
                locationId: z.string().optional().nullable(),
                status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
                image: z.string().optional().nullable(),
                userId: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            // Verify resource belongs to company
            const existing = await ctx.prisma.resource.findFirst({
                where: { id, companyId: ctx.company.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            const resource = await ctx.prisma.resource.update({
                where: { id },
                data,
            });

            return resource;
        }),

    /**
     * Delete a resource (set to INACTIVE)
     */
    delete: companyProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Verify resource belongs to company
            const existing = await ctx.prisma.resource.findFirst({
                where: { id: input.id, companyId: ctx.company.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            await ctx.prisma.resource.update({
                where: { id: input.id },
                data: { status: "INACTIVE" },
            });

            return { success: true };
        }),

    /**
     * Assign services to a resource
     */
    assignServices: companyProcedure
        .input(
            z.object({
                resourceId: z.string(),
                serviceIds: z.array(z.string()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify resource belongs to company
            const resource = await ctx.prisma.resource.findFirst({
                where: { id: input.resourceId, companyId: ctx.company.id },
            });

            if (!resource) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            // Remove existing assignments
            await ctx.prisma.serviceResource.deleteMany({
                where: { resourceId: input.resourceId },
            });

            // Create new assignments
            if (input.serviceIds.length > 0) {
                await ctx.prisma.serviceResource.createMany({
                    data: input.serviceIds.map((serviceId) => ({
                        serviceId,
                        resourceId: input.resourceId,
                    })),
                });
            }

            return { success: true };
        }),

    /**
     * Unassign a single service from a resource
     */
    unassignService: companyProcedure
        .input(
            z.object({
                resourceId: z.string(),
                serviceId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify resource belongs to company
            const resource = await ctx.prisma.resource.findFirst({
                where: { id: input.resourceId, companyId: ctx.company.id },
            });

            if (!resource) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            await ctx.prisma.serviceResource.delete({
                where: {
                    serviceId_resourceId: {
                        serviceId: input.serviceId,
                        resourceId: input.resourceId,
                    },
                },
            });

            return { success: true };
        }),

    /**
     * Get availability for a resource
     */
    getAvailability: companyProcedure
        .input(z.object({ resourceId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.availability.findMany({
                where: { resourceId: input.resourceId },
                orderBy: { dayOfWeek: 'asc' }
            });
        }),

    /**
     * Update availability for a resource (full replace)
     */
    updateAvailability: companyProcedure
        .input(
            z.object({
                resourceId: z.string(),
                slots: z.array(z.object({
                    dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
                    startTime: z.string(),
                    endTime: z.string(),
                    isAvailable: z.boolean().default(true)
                }))
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify resource belongs to company
            const resource = await ctx.prisma.resource.findFirst({
                where: { id: input.resourceId, companyId: ctx.company.id },
            });

            if (!resource) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            // Transaction to replace all slots
            return await ctx.prisma.$transaction(async (tx) => {
                // 1. Delete all current slots
                await tx.availability.deleteMany({
                    where: { resourceId: input.resourceId }
                });

                // 2. Create new slots
                if (input.slots.length > 0) {
                    await tx.availability.createMany({
                        data: input.slots.map(slot => ({
                            resourceId: input.resourceId,
                            ...slot
                        }))
                    });
                }

                return { success: true };
            });
        }),

    /**
     * Add a blockout for a resource
     */
    addBlockout: companyProcedure
        .input(z.object({
            resourceId: z.string(),
            description: z.string().optional(),
            startTime: z.date(),
            endTime: z.date()
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify resource belongs to company
            const resource = await ctx.prisma.resource.findFirst({
                where: { id: input.resourceId, companyId: ctx.company.id },
            });

            if (!resource) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recurso no encontrado",
                });
            }

            return await ctx.prisma.blockout.create({
                data: {
                    resourceId: input.resourceId,
                    description: input.description,
                    startTime: input.startTime,
                    endTime: input.endTime
                }
            });
        }),

    /**
     * Remove a blockout
     */
    removeBlockout: companyProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const blockout = await ctx.prisma.blockout.findFirst({
                where: {
                    id: input.id,
                    resource: { companyId: ctx.company.id }
                }
            });

            if (!blockout) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Bloqueo no encontrado",
                });
            }

            await ctx.prisma.blockout.delete({
                where: { id: input.id }
            });

            return { success: true };
        }),
});
