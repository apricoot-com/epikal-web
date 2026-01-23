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

            // 2. Validate Slot Availability (Concurrency check)
            // TODO: Call checkAvailability helper
            console.log("Checking availability for", input.startTime);

            // 3. Create Booking
            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new Error("Service not found");

            const endTime = new Date(new Date(input.startTime).getTime() + service.duration * 60000);

            const booking = await ctx.prisma.booking.create({
                data: {
                    companyId: company.id,
                    serviceId: input.serviceId,
                    resourceId: input.resourceId,
                    startTime: new Date(input.startTime),
                    endTime: endTime,
                    customerName: input.customer.name,
                    customerEmail: input.customer.email,
                    customerPhone: input.customer.phone
                }
            });

            return { success: true, bookingId: booking.id };
        })
});
