import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const analyticsPath = path.join(process.cwd(), 'public', 'templates', 'default', 'analytics.js');

        if (!fs.existsSync(analyticsPath)) {
            return new NextResponse('Analytics script not found', { status: 404 });
        }

        const content = fs.readFileSync(analyticsPath, 'utf-8');

        return new NextResponse(content, {
            headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error('Error serving analytics.js:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
