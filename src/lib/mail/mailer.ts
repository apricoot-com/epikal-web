import { EmailService } from './email-service';

/**
 * Specifically for booking confirmations
 */
export async function sendBookingConfirmationEmail({
    customerEmail,
    customerName,
    companyName,
    serviceName,
    startTime,
    confirmationUrl,
    companyLogo,
    brandingColor,
}: {
    customerEmail: string;
    customerName: string;
    companyName: string;
    serviceName: string;
    startTime: Date;
    confirmationUrl: string;
    companyLogo?: string | null;
    brandingColor?: string | null;
}) {
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(startTime);

    return EmailService.send({
        to: customerEmail,
        template: 'BOOKING_CONFIRMATION',
        data: {
            customerName,
            companyName,
            serviceName,
            formattedDate,
            confirmationUrl,
            companyLogo,
            brandingColor,
        }
    });
}
