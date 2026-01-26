/**
 * Booking Router (Updated to ensure Prisma schema synchronization)
 */
import { z } from 'zod';
import { router, publicProcedure, companyProcedure } from '../init';
import { getAvailableSlots } from '@/src/lib/scheduling/availability';
import { sendBookingConfirmationEmail, sendBookingSuccessEmail } from '@/src/lib/mail/mailer';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

export const bookingRouter = router({
    /**
     * Public: Get available slots for a service in a date range
     */
    getSlots: publicProcedure
        .input(z.object({
            serviceId: z.string(),
            startDate: z.string(), // ISO Date
            endDate: z.string(),   // ISO Date
            resourceId: z.string().optional()
        }))
        .query(async ({ input }) => {
            const start = new Date(input.startDate);
            const end = new Date(input.endDate);

            const slots = await getAvailableSlots({
                serviceId: input.serviceId,
                startDate: start,
                endDate: end,
                resourceId: input.resourceId
            });

            return slots;
        }),

    /**
     * Public: Create a new booking
     */
    create: publicProcedure
        .input(z.object({
            siteId: z.string(), // Company slug or custom domain
            serviceId: z.string(),
            resourceId: z.string(),
            startTime: z.string(), // ISO DateTime
            customer: z.object({
                name: z.string(),
                email: z.string().email(),
                phone: z.string().optional()
            })
        }))
        .mutation(async ({ ctx, input }) => {
            // 1. Resolve Company
            const company = await ctx.prisma.company.findFirst({
                where: { OR: [{ slug: input.siteId }, { customDomain: input.siteId }] },
                include: { branding: true }
            });

            if (!company) throw new Error("Company not found");

            const nameParts = input.customer.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            // 2. Resolve Service for duration
            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new Error("Service not found");

            const endTime = new Date(new Date(input.startTime).getTime() + service.duration * 60000);

            // 3. Resolve or Create CRM Customer
            const customer = await ctx.prisma.customer.upsert({
                where: {
                    companyId_email: {
                        companyId: company.id,
                        email: input.customer.email
                    }
                },
                update: {
                    totalBookings: { increment: 1 },
                    lastBookingAt: new Date(input.startTime)
                },
                create: {
                    companyId: company.id,
                    email: input.customer.email,
                    firstName: firstName,
                    lastName: lastName,
                    phone: input.customer.phone,
                    totalBookings: 1,
                    lastBookingAt: new Date(input.startTime)
                }
            });

            const requiresConfirmation = company.requiresBookingConfirmation;
            const confirmationToken = requiresConfirmation ? crypto.randomUUID() : null;

            // 3. Create Booking
            const booking = await ctx.prisma.booking.create({
                data: {
                    companyId: company.id,
                    serviceId: input.serviceId,
                    resourceId: input.resourceId,
                    startTime: new Date(input.startTime),
                    endTime: endTime,
                    status: requiresConfirmation ? 'PENDING' : 'CONFIRMED',
                    confirmationToken: confirmationToken,
                    // Legacy fields
                    customerName: input.customer.name,
                    customerEmail: input.customer.email,
                    customerPhone: input.customer.phone,
                    // CRM Link
                    customerId: customer.id
                }
            });

            // 4. Send Confirmation Email if needed
            if (requiresConfirmation && confirmationToken) {
                // Determine the correct host for the link
                const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
                const siteHost = company.customDomain || `${company.slug}.${rootDomain}`;

                // Construct URL (using http for local dev, should be https in prod with actual domains)
                const protocol = siteHost.includes('localhost') ? 'http' : 'https';
                const confirmationUrl = `${protocol}://${siteHost}/confirm-booking?token=${confirmationToken}`;

                await sendBookingConfirmationEmail({
                    customerEmail: input.customer.email,
                    customerName: input.customer.name,
                    companyName: company.name,
                    serviceName: service.name,
                    startTime: new Date(input.startTime),
                    confirmationUrl,
                    companyLogo: company.branding?.logoUrl,
                    brandingColor: company.branding?.primaryColor
                });
            } else if (!requiresConfirmation) {
                // Direct booking: Send success email immediately
                await sendBookingSuccessEmail({
                    customerEmail: input.customer.email,
                    customerName: input.customer.name,
                    companyName: company.name,
                    serviceName: service.name,
                    startTime: new Date(input.startTime),
                    durationInMinutes: service.duration,
                    companyLogo: company.branding?.logoUrl,
                    brandingColor: company.branding?.primaryColor
                });
            }

            return {
                success: true,
                bookingId: booking.id,
                status: booking.status
            };
        }),

    /**
     * Public: Confirm a booking via token
     */
    confirmByToken: publicProcedure
        .input(z.object({
            token: z.string().min(1)
        }))
        .mutation(async ({ ctx, input }) => {
            const booking = await ctx.prisma.booking.findUnique({
                where: { confirmationToken: input.token },
                include: {
                    company: {
                        include: { branding: true }
                    },
                    service: true
                }
            });

            if (!booking) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Token de confirmación inválido o expirado.'
                });
            }

            if (booking.status !== 'PENDING') {
                return { success: true, message: "La cita ya está confirmada o procesada." };
            }

            // Update status
            await ctx.prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CONFIRMED',
                    confirmationToken: null // Clear token after use
                }
            });

            // Trigger Success Email
            await sendBookingSuccessEmail({
                customerEmail: booking.customerEmail,
                customerName: booking.customerName,
                companyName: booking.company.name,
                serviceName: booking.service.name,
                startTime: booking.startTime,
                durationInMinutes: booking.service.duration,
                companyLogo: booking.company.branding?.logoUrl,
                brandingColor: booking.company.branding?.primaryColor
            });

            return {
                companyName: booking.company.name,
                companySlug: booking.company.slug,
                customDomain: booking.company.customDomain,
                startTime: booking.startTime,
            };
        }),

    /**
     * Dashboard: Update booking status (confirm, cancel, complete, no-show)
     */
    updateStatus: companyProcedure
        .input(z.object({
            id: z.string(),
            status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.booking.update({
                where: {
                    id: input.id,
                    companyId: ctx.company.id // Security check
                },
                data: { status: input.status }
            });
        })
});
