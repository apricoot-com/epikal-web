
import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const testimonialRouter = router({
    getAll: companyProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.testimonial.findMany({
            where: { companyId: ctx.company.id },
            orderBy: { sortOrder: 'asc' },
        });
    }),

    create: companyProcedure
        .input(z.object({
            name: z.string().min(1),
            title: z.string().optional(),
            text: z.string().min(1),
            image: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.testimonial.create({
                data: {
                    companyId: ctx.company.id,
                    ...input,
                },
            });
        }),

    update: companyProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            title: z.string().optional(),
            text: z.string().optional(),
            image: z.string().optional(),
            isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const testimonial = await ctx.prisma.testimonial.findUnique({
                where: { id },
            });

            if (!testimonial || testimonial.companyId !== ctx.company.id) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return await ctx.prisma.testimonial.update({
                where: { id },
                data,
            });
        }),

    delete: companyProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const testimonial = await ctx.prisma.testimonial.findUnique({
                where: { id: input.id },
            });

            if (!testimonial || testimonial.companyId !== ctx.company.id) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return await ctx.prisma.testimonial.delete({
                where: { id: input.id },
            });
        }),
});
