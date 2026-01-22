import crypto from 'crypto';
import { prisma } from '@/src/server/db/client';

interface FBConversionEvent {
    companyId: string;
    eventName: 'Lead' | 'ViewContent' | 'Schedule';
    userData: {
        email?: string;
        phone?: string;
        ip?: string;
        userAgent?: string;
    };
    customData?: {
        service_id?: string;
        service_name?: string;
        value?: number;
        currency?: string;
    };
}

/**
 * Hash user data with SHA256 for privacy compliance
 */
function hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Track conversion event via Facebook Conversions API (server-side)
 * 
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 */
export async function trackFacebookConversion(event: FBConversionEvent) {
    try {
        // Fetch company's Facebook Pixel configuration
        const company = await prisma.company.findUnique({
            where: { id: event.companyId },
            select: { fbPixelId: true, fbAccessToken: true }
        });

        if (!company?.fbPixelId || !company?.fbAccessToken) {
            // No FB tracking configured for this company
            return;
        }

        // Hash user data for privacy
        const hashedUserData: any = {};

        if (event.userData.email) {
            hashedUserData.em = hashData(event.userData.email.toLowerCase().trim());
        }

        if (event.userData.phone) {
            // Remove all non-digit characters before hashing
            hashedUserData.ph = hashData(event.userData.phone.replace(/\D/g, ''));
        }

        if (event.userData.ip) {
            hashedUserData.client_ip_address = event.userData.ip;
        }

        if (event.userData.userAgent) {
            hashedUserData.client_user_agent = event.userData.userAgent;
        }

        // Send event to Facebook
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${company.fbPixelId}/events`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: [{
                        event_name: event.eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        user_data: hashedUserData,
                        custom_data: event.customData || {},
                        action_source: 'website'
                    }],
                    access_token: company.fbAccessToken
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('FB Conversion API error:', errorText);
        } else {
            console.log(`✓ FB Conversion tracked: ${event.eventName} for company ${event.companyId}`);
        }
    } catch (error) {
        console.error('FB Conversion API request failed:', error);
    }
}
