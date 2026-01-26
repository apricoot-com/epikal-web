import { z } from 'zod';
import { router, companyProcedure } from '../init';

export const calendarRouter = router({
    /**
     * Dashboard: Get calendar events (bookings + blockouts)
     */
    getEvents: companyProcedure
        .input(z.object({
            start: z.string().datetime(),
            end: z.string().datetime(),
            resourceIds: z.array(z.string()).optional()
        }))
        .query(async ({ ctx, input }) => {
            const whereClause = {
                companyId: ctx.company.id,
                startTime: {
                    gte: new Date(input.start),
                    lte: new Date(input.end)
                },
                ...(input.resourceIds?.length ? { resourceId: { in: input.resourceIds } } : {})
            };

            const [bookings, blockouts] = await Promise.all([
                ctx.prisma.booking.findMany({
                    where: whereClause,
                    include: {
                        resource: { select: { id: true, name: true } },
                        service: { select: { id: true, name: true } }
                    }
                }),
                ctx.prisma.blockout.findMany({
                    where: {
                        resource: { companyId: ctx.company.id }, // Blockout doesn't have direct companyId, but resource does
                        ...(input.resourceIds?.length ? { resourceId: { in: input.resourceIds } } : {}),
                        startTime: {
                            gte: new Date(input.start),
                            lte: new Date(input.end)
                        }
                    },
                    include: {
                        resource: { select: { id: true, name: true } }
                    }
                })
            ]);

            // Normalize to FullCalendar event format
            return [
                ...bookings.map(b => ({
                    id: `booking-${b.id}`,
                    title: `${b.customerName} - ${b.service.name}`,
                    start: b.startTime,
                    end: b.endTime,
                    resourceId: b.resourceId,
                    classNames: ['cursor-pointer', 'pointer-events-auto'],
                    extendedProps: {
                        originalId: b.id,
                        type: 'booking',
                        status: b.status,
                        email: b.customerEmail,
                        phone: b.customerPhone,
                        serviceName: b.service.name,
                        resourceName: b.resource.name,
                        customerName: b.customerName,
                        customerId: b.customerId
                    }
                })),
                ...blockouts.map(b => ({
                    id: `blockout-${b.id}`,
                    title: b.description || 'Bloqueado',
                    start: b.startTime,
                    end: b.endTime,
                    resourceId: b.resourceId,
                    color: '#4b5563', // Darker gray for visibility
                    classNames: ['cursor-pointer', 'pointer-events-auto'],
                    extendedProps: {
                        originalId: b.id,
                        type: 'blockout',
                        resourceName: b.resource.name
                    }
                }))
            ];
        }),

    /**
     * Dashboard: Create a manual blockout
     */
    createBlockout: companyProcedure
        .input(z.object({
            resourceId: z.string(),
            description: z.string().optional(),
            start: z.string().datetime(),
            end: z.string().datetime()
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.blockout.create({
                data: {
                    resourceId: input.resourceId,
                    description: input.description,
                    startTime: new Date(input.start),
                    endTime: new Date(input.end)
                }
            });
        })
});
