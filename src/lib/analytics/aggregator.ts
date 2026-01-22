import { prisma } from '@/src/server/db/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * Aggregate analytics events into daily statistics
 * 
 * This function processes raw AnalyticsEvent records and creates/updates
 * DailyStats entries with aggregated metrics.
 * 
 * @param date - The date to aggregate (defaults to yesterday)
 */
export async function aggregateDailyStats(date: Date = subDays(new Date(), 1)) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    console.log(`[Analytics Aggregator] Starting aggregation for ${startDate.toISOString()}`);

    // Get all companies that have analytics events
    const companies = await prisma.company.findMany({
        where: {
            analyticsEvents: {
                some: {
                    timestamp: {
                        gte: startDate,
                        lt: endDate
                    }
                }
            }
        },
        select: { id: true, name: true }
    });

    console.log(`[Analytics Aggregator] Found ${companies.length} companies with events`);

    let processedCount = 0;

    for (const company of companies) {
        try {
            // Fetch all events for this company on this date
            const events = await prisma.analyticsEvent.findMany({
                where: {
                    companyId: company.id,
                    timestamp: {
                        gte: startDate,
                        lt: endDate
                    }
                },
                include: {
                    service: {
                        select: { id: true, name: true }
                    }
                }
            });

            if (events.length === 0) continue;

            // Calculate basic metrics
            const pageViews = events.length;
            const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;

            // Calculate top services
            const serviceViewsMap = new Map<string, { id: string; name: string; views: number }>();

            for (const event of events) {
                if (event.serviceId && event.service) {
                    const existing = serviceViewsMap.get(event.serviceId);
                    if (existing) {
                        existing.views++;
                    } else {
                        serviceViewsMap.set(event.serviceId, {
                            id: event.service.id,
                            name: event.service.name,
                            views: 1
                        });
                    }
                }
            }

            const topServices = Array.from(serviceViewsMap.values())
                .sort((a, b) => b.views - a.views)
                .slice(0, 5);

            // Calculate top traffic sources
            const sourceViewsMap = new Map<string, number>();

            for (const event of events) {
                const source = event.utmSource || 'Directo';
                sourceViewsMap.set(source, (sourceViewsMap.get(source) || 0) + 1);
            }

            const topSources = Array.from(sourceViewsMap.entries())
                .map(([source, views]) => ({ source, views }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 5);

            // Upsert daily stats
            await prisma.dailyStats.upsert({
                where: {
                    companyId_date: {
                        companyId: company.id,
                        date: startDate
                    }
                },
                create: {
                    companyId: company.id,
                    date: startDate,
                    pageViews,
                    uniqueVisitors,
                    topServices,
                    topSources
                },
                update: {
                    pageViews,
                    uniqueVisitors,
                    topServices,
                    topSources
                }
            });

            processedCount++;
            console.log(`[Analytics Aggregator] ✓ Processed ${company.name}: ${pageViews} views, ${uniqueVisitors} unique visitors`);

        } catch (error) {
            console.error(`[Analytics Aggregator] ✗ Error processing company ${company.name}:`, error);
        }
    }

    console.log(`[Analytics Aggregator] Completed: ${processedCount}/${companies.length} companies processed`);

    return {
        success: true,
        date: startDate.toISOString(),
        companiesProcessed: processedCount,
        companiesTotal: companies.length
    };
}

/**
 * Optional: Clean up old analytics events
 * 
 * Deletes raw events older than the specified number of days
 * to keep database size manageable.
 * 
 * @param retentionDays - Number of days to retain (default: 90)
 */
export async function cleanupOldEvents(retentionDays: number = 90) {
    const cutoffDate = subDays(new Date(), retentionDays);

    console.log(`[Analytics Cleanup] Deleting events older than ${cutoffDate.toISOString()}`);

    const result = await prisma.analyticsEvent.deleteMany({
        where: {
            timestamp: {
                lt: cutoffDate
            }
        }
    });

    console.log(`[Analytics Cleanup] Deleted ${result.count} old events`);

    return {
        success: true,
        deletedCount: result.count
    };
}
