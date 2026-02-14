import { z } from 'zod';
import { router, companyProcedure } from '../init';
import { startOfDay, subDays } from 'date-fns';
import { aggregateDailyStats } from '@/src/lib/analytics/aggregator';

export const analyticsRouter = router({
    /**
     * Get overview stats for the last N days
     */
    getOverview: companyProcedure
        .input(z.object({
            days: z.number().default(30)
        }))
        .query(async ({ ctx, input }) => {
            // Use startOfDay to include the full range of days, including today
            const startDate = startOfDay(subDays(new Date(), input.days));

            const stats = await ctx.prisma.dailyStats.aggregate({
                where: {
                    companyId: ctx.company.id,
                    date: { gte: startDate }
                },
                _sum: {
                    pageViews: true,
                    uniqueVisitors: true
                }
            });

            return {
                totalPageViews: stats._sum.pageViews || 0,
                totalUniqueVisitors: stats._sum.uniqueVisitors || 0
            };
        }),

    /**
     * Get daily timeline data
     */
    getDailyTimeline: companyProcedure
        .input(z.object({
            days: z.number().default(30)
        }))
        .query(async ({ ctx, input }) => {
            const startDate = startOfDay(subDays(new Date(), input.days));

            const dailyData = await ctx.prisma.dailyStats.findMany({
                where: {
                    companyId: ctx.company.id,
                    date: { gte: startDate }
                },
                orderBy: { date: 'asc' },
                select: {
                    date: true,
                    pageViews: true,
                    uniqueVisitors: true
                }
            });

            return dailyData;
        }),

    /**
     * Get top services by views
     */
    getTopServices: companyProcedure
        .input(z.object({
            days: z.number().default(30),
            limit: z.number().default(5)
        }))
        .query(async ({ ctx, input }) => {
            const startDate = startOfDay(subDays(new Date(), input.days));

            // Group events by serviceId
            const events = await ctx.prisma.analyticsEvent.groupBy({
                by: ['serviceId'],
                where: {
                    companyId: ctx.company.id,
                    serviceId: { not: null },
                    timestamp: { gte: startDate }
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: input.limit
            });

            // Fetch service details
            const serviceIds = events.map((e: any) => e.serviceId!).filter(Boolean);
            const services = await ctx.prisma.service.findMany({
                where: { id: { in: serviceIds } },
                select: { id: true, name: true }
            });

            const servicesMap = new Map(services.map((s: any) => [s.id, s.name]));

            return events.map((e: any) => ({
                id: e.serviceId!,
                name: servicesMap.get(e.serviceId!) || 'Unknown',
                views: e._count.id
            }));
        }),

    /**
     * Get top traffic sources by UTM
     */
    getTopSources: companyProcedure
        .input(z.object({
            days: z.number().default(30),
            limit: z.number().default(5)
        }))
        .query(async ({ ctx, input }) => {
            const startDate = startOfDay(subDays(new Date(), input.days));

            const events = await ctx.prisma.analyticsEvent.groupBy({
                by: ['utmSource'],
                where: {
                    companyId: ctx.company.id,
                    timestamp: { gte: startDate }
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: input.limit
            });

            return events.map((e: any) => ({
                source: e.utmSource || 'Directo',
                views: e._count.id
            }));
        }),

    /**
     * Update Google Tag Manager settings
     */
    updateGTM: companyProcedure
        .input(z.object({
            gtmContainerId: z.string().regex(/^GTM-[A-Z0-9]+$/).nullable()
        }))
        .mutation(async ({ ctx, input }) => {
            const siteSettings = (ctx.company.siteSettings as any) || {};

            await ctx.prisma.company.update({
                where: { id: ctx.company.id },
                data: {
                    siteSettings: {
                        ...siteSettings,
                        gtmContainerId: input.gtmContainerId
                    }
                }
            });

            return { success: true };
        }),

    /**
     * Update Facebook Pixel settings
     */
    updateFacebookPixel: companyProcedure
        .input(z.object({
            fbPixelId: z.string().nullable(),
            fbAccessToken: z.string().nullable()
        }))
        .mutation(async ({ ctx, input }) => {
            const siteSettings = (ctx.company.siteSettings as any) || {};

            await ctx.prisma.company.update({
                where: { id: ctx.company.id },
                data: {
                    siteSettings: {
                        ...siteSettings,
                        fbPixelId: input.fbPixelId,
                        fbAccessToken: input.fbAccessToken
                    }
                }
            });

            return { success: true };
        }),

    /**
     * Force analytics aggregation (Admin only)
     * Manually trigger the daily stats aggregation for testing
     */
    forceAggregate: companyProcedure
        .mutation(async () => {
            try {
                console.log('[tRPC] forceAggregate called');

                // Run aggregation for TODAY to see immediate results from testing
                const today = new Date();
                console.log('[tRPC] Calling aggregateDailyStats for:', today.toISOString());

                const result = await aggregateDailyStats(today);

                console.log('[tRPC] Aggregation result:', result);
                return result;
            } catch (error) {
                console.error('[tRPC] forceAggregate error:', error);
                throw error;
            }
        })
});
