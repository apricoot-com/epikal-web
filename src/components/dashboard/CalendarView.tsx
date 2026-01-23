'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { trpc } from '@/src/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/header';

export default function CalendarView() {
    const { toast } = useToast();
    const [view, setView] = useState('timeGridWeek');
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(),
        end: new Date()
    });

    // Filters
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

    // Fetch resources for filter
    const { data: resources } = trpc.resource.list.useQuery();

    // Fetch events based on current view range and filters
    const { data: events, isLoading, refetch } = trpc.calendar.getEvents.useQuery({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        resourceIds: selectedResourceId ? [selectedResourceId] : undefined
    }, {
        enabled: !!dateRange.start,
        placeholderData: (previousData) => previousData
    });

    const handleDatesSet = (dateInfo: any) => {
        setDateRange({
            start: dateInfo.start,
            end: dateInfo.end
        });
    };

    const handleEventClick = (info: any) => {
        // TODO: Open detail modal
        toast({
            title: info.event.title,
            description: `Recurso: ${info.event.extendedProps.resourceId}`
        });
    };

    return (
        <>
            <DashboardHeader title="Agenda" />
            <div className="flex flex-1 flex-col p-4 h-[calc(100vh-64px)]">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedResourceId || "all"}
                            onValueChange={(val) => setSelectedResourceId(val === "all" ? null : val)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Todos los recursos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los recursos</SelectItem>
                                {resources?.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Bloqueo
                        </Button>
                    </div>
                </div>

                <Card className="flex-1 overflow-hidden">
                    <CardContent className="p-6 h-full">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            locale="es"
                            datesSet={handleDatesSet}
                            events={events || []}
                            eventClick={handleEventClick}
                            nowIndicator
                            allDaySlot={false}
                            slotMinTime="08:00:00"
                            slotMaxTime="20:00:00"
                            height="100%"
                            // expandRows removed for natural scrolling
                            stickyHeaderDates
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
