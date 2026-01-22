import { NextRequest, NextResponse } from 'next/server';
import { aggregateDailyStats, cleanupOldEvents } from '@/src/lib/analytics/aggregator';

/**
 * Cron endpoint for daily analytics aggregation
 * 
 * This endpoint should be called daily (e.g., at 2:00 AM) by a cron service
 * like Vercel Cron, GitHub Actions, or an external service.
 * 
 * Security: Uses a CRON_SECRET environment variable to authenticate requests.
 * 
 * Usage:
 * - Set CRON_SECRET in your environment variables
 * - Call: GET /api/cron/aggregate-analytics
 * - Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = req.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (!process.env.CRON_SECRET) {
            console.error('[Cron] CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'Cron secret not configured' },
                { status: 500 }
            );
        }

        if (authHeader !== expectedAuth) {
            console.warn('[Cron] Unauthorized aggregation attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Run aggregation for yesterday
        const aggregationResult = await aggregateDailyStats();

        // Optional: Clean up old events (older than 90 days)
        const cleanupResult = await cleanupOldEvents(90);

        return NextResponse.json({
            success: true,
            aggregation: aggregationResult,
            cleanup: cleanupResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Cron] Aggregation error:', error);
        return NextResponse.json(
            {
                error: 'Aggregation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
