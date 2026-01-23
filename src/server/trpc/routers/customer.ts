
import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const customerRouter = router({
    list: companyProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                offset: z.number().min(0).default(0),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const where = {
                companyId: ctx.company.id,
                OR: input.search
                    ? [
                        { firstName: { contains: input.search, mode: "insensitive" as const } },
                        { lastName: { contains: input.search, mode: "insensitive" as const } },
                        { email: { contains: input.search, mode: "insensitive" as const } },
                    ]
                    : undefined,
            };

            // DEBUG: Check if customer model exists
            // console.log("Prisma keys:", Object.keys(ctx.prisma));
            if (!(ctx.prisma as any).customer) {
                console.error("CRITICAL: ctx.prisma.customer is undefined!");
                console.error("Available keys:", Object.keys(ctx.prisma));
            }

            const [items, total] = await Promise.all([
                ctx.prisma.customer.findMany({
                    where,
                    take: input.limit,
                    skip: input.offset,
                    orderBy: { lastBookingAt: "desc" },
                }),
                ctx.prisma.customer.count({ where }),
            ]);

            return { items, total };
        }),

    get: companyProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const customer = await ctx.prisma.customer.findUnique({
                where: { id: input.id },
                include: {
                    bookings: {
                        orderBy: { startTime: "desc" },
                        take: 50,
                        include: {
                            service: true,
                            resource: true,
                        },
                    },
                },
            });

            if (!customer || customer.companyId !== ctx.company.id) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return customer;
        }),

    create: companyProcedure
        .input(
            z.object({
                firstName: z.string().min(1),
                lastName: z.string().optional(),
                email: z.string().email(),
                phone: z.string().optional(),
                notes: z.string().optional(),
                tags: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if exists
            const existing = await ctx.prisma.customer.findUnique({
                where: {
                    companyId_email: {
                        companyId: ctx.company.id,
                        email: input.email,
                    },
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Customer with this email already exists",
                });
            }

            return ctx.prisma.customer.create({
                data: {
                    companyId: ctx.company.id,
                    ...input,
                },
            });
        }),

    update: companyProcedure
        .input(
            z.object({
                id: z.string(),
                data: z.object({
                    firstName: z.string().optional(),
                    lastName: z.string().optional(),
                    email: z.string().email().optional(),
                    phone: z.string().optional(),
                    notes: z.string().optional(),
                    tags: z.array(z.string()).optional(),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const customer = await ctx.prisma.customer.findUnique({
                where: { id: input.id },
            });

            if (!customer || customer.companyId !== ctx.company.id) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.customer.update({
                where: { id: input.id },
                data: input.data,
            });
        }),
});
