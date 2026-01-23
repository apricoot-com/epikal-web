import { z } from 'zod';
import { router, publicProcedure, companyProcedure } from '../init';
import { getAvailableSlots } from '@/src/lib/scheduling/availability';

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
                where: { OR: [{ slug: input.siteId }, { customDomain: input.siteId }] }
            });

            if (!company) throw new Error("Company not found");

            // 2. Create Booking linked to Customer (Find or Create)
            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new Error("Service not found");

            const endTime = new Date(new Date(input.startTime).getTime() + service.duration * 60000);

            // Split name best effort
            const nameParts = input.customer.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const booking = await ctx.prisma.booking.create({
                data: {
                    companyId: company.id,
                    serviceId: input.serviceId,
                    resourceId: input.resourceId,
                    startTime: new Date(input.startTime),
                    endTime: endTime,
                    // Legacy fields
                    customerName: input.customer.name,
                    customerEmail: input.customer.email,
                    customerPhone: input.customer.phone,

                    // CRM Link
                    customer: {
                        connectOrCreate: {
                            where: {
                                companyId_email: {
                                    companyId: company.id,
                                    email: input.customer.email
                                }
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
                        }
                    }
                }
            });

            // Update stats if customer already existed (not covered by create above)
            // Ideally we'd use an interactive transaction or raw query, but for now this is fine.
            // We can also let the trigger or periodic job handle stats.

            return { success: true, bookingId: booking.id };
        })
});
