import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

/**
 * Service router
 * CRUD for company services
 */
export const serviceRouter = router({
    /**
     * List all services for the company
     */
    list: companyProcedure
        .input(
            z.object({
                includeInactive: z.boolean().optional().default(false),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const services = await ctx.prisma.service.findMany({
                where: {
                    companyId: ctx.company.id,
                    ...(input?.includeInactive ? {} : { status: "ACTIVE" }),
                },
                include: {
                    resources: {
                        include: {
                            resource: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            });

            return services.map((s) => ({
                ...s,
                price: s.price.toNumber(),
                depositAmount: s.depositAmount?.toNumber() ?? null,
            }));
        }),

    /**
     * Get a single service by ID
     */
    get: companyProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const service = await ctx.prisma.service.findFirst({
                where: {
                    id: input.id,
                    companyId: ctx.company.id,
                },
                include: {
                    resources: {
                        include: {
                            resource: true,
                        },
                    },
                    webPage: true,
                },
            });
            if (!service) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Servicio no encontrado",
                });
            }

            return {
                ...service,
                price: service.price.toNumber(),
                depositAmount: service.depositAmount?.toNumber() ?? null,
            };
        }),

    /**
     * Create a new service
     */
    create: companyProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                slug: z.string().min(1).max(100).optional(),
                description: z.string().max(2000).optional(),
                duration: z.number().int().min(5).max(480),
                price: z.number().min(0),
                allowsDeposit: z.boolean().optional().default(false),
                depositAmount: z.number().min(0).optional(),
                isPublic: z.boolean().optional().default(true),
                resourceIds: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { resourceIds, ...data } = input;

            // Simple slugify helper inside for fallback
            const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
            const finalSlug = data.slug || slugify(data.name);

            // Get max sortOrder
            const maxOrder = await ctx.prisma.service.aggregate({
                where: { companyId: ctx.company.id },
                _max: { sortOrder: true },
            });

            const service = await ctx.prisma.service.create({
                data: {
                    companyId: ctx.company.id,
                    name: data.name,
                    slug: finalSlug,
                    description: data.description,
                    duration: data.duration,
                    price: data.price,
                    allowsDeposit: data.allowsDeposit,
                    depositAmount: data.depositAmount ?? null,
                    isPublic: data.isPublic,
                    sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
                },
            });

            // Assign resources if provided
            if (resourceIds && resourceIds.length > 0) {
                await ctx.prisma.serviceResource.createMany({
                    data: resourceIds.map((resourceId) => ({
                        serviceId: service.id,
                        resourceId,
                    })),
                });
            }

            return {
                ...service,
                price: service.price.toNumber(),
                depositAmount: service.depositAmount?.toNumber() ?? null,
            };
        }),

    /**
     * Update a service
     */
    update: companyProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                slug: z.string().min(1).max(100).optional(),
                description: z.string().max(2000).optional().nullable(),
                duration: z.number().int().min(5).max(480).optional(),
                price: z.number().min(0).optional(),
                allowsDeposit: z.boolean().optional(),
                depositAmount: z.number().min(0).optional().nullable(),
                isPublic: z.boolean().optional(),
                status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
                sortOrder: z.number().int().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, price, depositAmount, ...data } = input;

            // Verify service belongs to company
            const existing = await ctx.prisma.service.findFirst({
                where: { id, companyId: ctx.company.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Servicio no encontrado",
                });
            }

            const service = await ctx.prisma.service.update({
                where: { id },
                data: {
                    ...data,
                    ...(price !== undefined ? { price } : {}),
                    ...(depositAmount !== undefined
                        ? { depositAmount: depositAmount ?? null }
                        : {}),
                },
            });

            return {
                ...service,
                price: service.price.toNumber(),
                depositAmount: service.depositAmount?.toNumber() ?? null,
            };
        }),

    /**
     * Delete a service (set to INACTIVE)
     */
    delete: companyProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Verify service belongs to company
            const existing = await ctx.prisma.service.findFirst({
                where: { id: input.id, companyId: ctx.company.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Servicio no encontrado",
                });
            }

            await ctx.prisma.service.update({
                where: { id: input.id },
                data: { status: "INACTIVE" },
            });

            return { success: true };
        }),

    /**
     * Update web-specific details for a service
     */
    updateWebDetails: companyProcedure
        .input(
            z.object({
                serviceId: z.string(),
                displayTitle: z.string().optional(),
                heroImage: z.string().optional().or(z.literal("")),
                content: z.string().optional(),
                blocks: z.array(z.any()).optional(), // SiteBlock[]
                seo: z.object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    keywords: z.string().optional(),
                    ogImage: z.string().optional()
                }).optional(),
                // Expect simple array: [{ question, answer }]
                faqs: z.array(z.object({
                    question: z.string(),
                    answer: z.string()
                })).optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { serviceId, faqs, ...data } = input;

            // Verify ownership
            const existing = await ctx.prisma.service.findFirst({
                where: { id: serviceId, companyId: ctx.company.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Servicio no encontrado",
                });
            }

            // Update or create ServiceWebPage
            const webPage = await ctx.prisma.serviceWebPage.upsert({
                where: { serviceId },
                create: {
                    serviceId,
                    ...data,
                    faqs: faqs as any, // Cast to InputJsonValue
                },
                update: {
                    ...data,
                    faqs: faqs as any,
                }
            });

            return webPage;
        }),
});
