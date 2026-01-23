import { prisma } from '@/src/server/db/client';
import { addMinutes, format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Availability, Blockout, Booking, Resource, Service } from '@prisma/client';

export interface TimeSlot {
    start: string; // ISO DateTime
    end: string;   // ISO DateTime
    resourceId?: string;
}

export interface AvailabilityQuery {
    serviceId: string;
    startDate: Date;
    endDate: Date;
    resourceId?: string; // Optional filter
}

// Map JS getDay() (0=Sunday) to Prisma DayOfWeek enum
const DAYS_MAP = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
];

/**
 * Core logic to calculate available slots based on:
 * 1. Service duration
 * 2. Resource availability (weekly schedule)
 * 3. Existing bookings
 * 4. Blockouts
 */
export async function getAvailableSlots({ serviceId, startDate, endDate, resourceId }: AvailabilityQuery): Promise<TimeSlot[]> {
    // 1. Fetch Service details (duration)
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
            resources: {
                include: {
                    resource: true
                }
            }
        }
    });

    if (!service) throw new Error("Service not found");

    // 2. Identify eligible resources
    // If resourceId is provided, check if it performs this service
    // Else, get all resources for this service
    let resources = service.resources.map((sr: any) => sr.resource);
    if (resourceId) {
        resources = resources.filter((r: any) => r.id === resourceId);
    }

    if (resources.length === 0) return []; // No resources available

    // 3. For each resource, get their Availability config + Bookings + Blockouts
    const resourceIds = resources.map((r: any) => r.id);

    // Fetch all schedule data in parallel
    const [availabilities, bookings, blockouts] = await Promise.all([
        prisma.availability.findMany({
            where: { resourceId: { in: resourceIds } }
        }),
        prisma.booking.findMany({
            where: {
                resourceId: { in: resourceIds },
                startTime: { gte: startDate, lt: endDate },
                status: { not: 'CANCELLED' }
            }
        }),
        prisma.blockout.findMany({
            where: {
                resourceId: { in: resourceIds },
                startTime: { gte: startDate, lt: endDate }
            }
        })
    ]);

    // 4. Algorithm: Generate slots and check availability
    const slots: TimeSlot[] = [];

    // Slot generation config
    // TODO: Ideally 'incrementMinutes' should be configurable per service or global setting
    // For now we use the service duration or 30 mins as step
    const incrementMinutes = 30;
    const slotDuration = service.duration; // In minutes

    let current = new Date(startDate);
    // Align current to next slot boundary if needed? 
    // For now assuming startDate is clean.

    while (isBefore(current, endDate)) {
        const slotStart = new Date(current);
        const slotEnd = addMinutes(slotStart, slotDuration);

        // Don't generate slots that go beyond the query range
        if (isAfter(slotEnd, endDate)) break;

        // Check availability for EACH resource
        for (const resource of resources) {
            const rId = (resource as Resource).id;

            // A. Check Working Hours (Availability)
            const dayName = DAYS_MAP[slotStart.getDay()];

            // Find availability rule for this resource on this day
            const schedule = availabilities.find(a =>
                a.resourceId === rId &&
                a.dayOfWeek === dayName &&
                a.isAvailable
            );

            if (!schedule) continue; // Not working this day

            // Parse working hours "09:00" -> Date today
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);

            const workStart = new Date(slotStart);
            workStart.setHours(startHour, startMin, 0, 0);

            const workEnd = new Date(slotStart);
            workEnd.setHours(endHour, endMin, 0, 0);

            // Slot must be fully within working hours
            // Condition: slotStart >= workStart AND slotEnd <= workEnd
            if (isBefore(slotStart, workStart) || isAfter(slotEnd, workEnd)) {
                continue;
            }

            // B. Check Bookings collision
            // Collision if: (SlotStart < BookingEnd) AND (SlotEnd > BookingStart)
            const hasBooking = bookings.some(b =>
                b.resourceId === rId &&
                isBefore(slotStart, b.endTime) &&
                isAfter(slotEnd, b.startTime)
            );

            if (hasBooking) continue;

            // C. Check Blockouts collision
            const hasBlockout = blockouts.some(b =>
                b.resourceId === rId &&
                isBefore(slotStart, b.endTime) &&
                isAfter(slotEnd, b.startTime)
            );

            if (hasBlockout) continue;

            // If we get here, the slot is available!
            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                resourceId: rId
            });

            // Optimization: If user didn't ask for a specific resource, 
            // maybe we only need one available resource per slot time?
            // But frontend might want to know WHO is available. 
            // Let's keep returning all options.
        }

        // Advance to next candidate slot
        current = addMinutes(current, incrementMinutes);
    }

    // Deduplicate slots if we don't care about resourceId? 
    // The interface says resourceId is optional, but returning it helps selection.
    // If the frontend just wants "Available Times", it can distinct by start time.

    return slots;
}
