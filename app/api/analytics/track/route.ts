import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/server/db/client';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const headersList = await headers();

        // Extract data
        const {
            companyId,
            type,
            path,
            pageType,
            serviceId,
            sessionId,
            visitorId,
            utm
        } = body;

        // Validation
        if (!companyId || !type || !path || !sessionId || !visitorId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Store event
        await prisma.analyticsEvent.create({
            data: {
                companyId,
                type,
                path,
                pageType: pageType || 'unknown',
                serviceId: serviceId || null,
                sessionId,
                visitorId,
                utmSource: utm?.utmSource || null,
                utmMedium: utm?.utmMedium || null,
                utmCampaign: utm?.utmCampaign || null,
                utmContent: utm?.utmContent || null,
                utmTerm: utm?.utmTerm || null,
                referrer: headersList.get('referer') || null,
                userAgent: headersList.get('user-agent') || null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Handle specific Prisma errors
        if (error.code === 'P2003') { // Foreign key constraint failed
            return NextResponse.json(
                { error: 'Invalid companyId or serviceId' },
                { status: 400 }
            );
        }

        console.error('Analytics tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
