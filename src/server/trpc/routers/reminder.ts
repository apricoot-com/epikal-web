
import { z } from 'zod';
import { router, companyProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const reminderRouter = router({
    /**
     * List all reminder configurations for the company
     */
    list: companyProcedure
        .query(async ({ ctx }) => {
            return ctx.prisma.reminderConfig.findMany({
                where: { companyId: ctx.company.id },
                orderBy: { createdAt: 'asc' }
            });
        }),

    /**
     * Create a new reminder configuration
     */
    create: companyProcedure
        .input(z.object({
            channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS']).default('EMAIL'),
            timeValue: z.number().int().min(1),
            timeUnit: z.enum(['MINUTES', 'HOURS', 'DAYS']),
            isActive: z.boolean().default(true)
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.prisma.reminderConfig.create({
                data: {
                    companyId: ctx.company.id,
                    channel: input.channel,
                    timeValue: input.timeValue,
                    timeUnit: input.timeUnit,
                    isActive: input.isActive
                }
            });
        }),

    /**
     * Toggle a reminder configuration (Active/Inactive)
     */
    toggle: companyProcedure
        .input(z.object({
            id: z.string(),
            isActive: z.boolean()
        }))
        .mutation(async ({ ctx, input }) => {
            const config = await ctx.prisma.reminderConfig.findFirst({
                where: { id: input.id, companyId: ctx.company.id }
            });

            if (!config) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Config not found' });
            }

            return ctx.prisma.reminderConfig.update({
                where: { id: input.id },
                data: { isActive: input.isActive }
            });
        }),

    /**
     * Delete a reminder configuration
     */
    delete: companyProcedure
        .input(z.object({
            id: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const config = await ctx.prisma.reminderConfig.findFirst({
                where: { id: input.id, companyId: ctx.company.id }
            });

            if (!config) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Config not found' });
            }

            return ctx.prisma.reminderConfig.delete({
                where: { id: input.id }
            });
        })
});
