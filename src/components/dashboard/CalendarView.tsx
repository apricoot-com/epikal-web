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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Calendar as CalendarIcon, User, Clock, Trash2, Edit, Copy, ExternalLink, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { CheckCircle, XCircle, Undo } from 'lucide-react';

export default function CalendarView() {
    const { toast } = useToast();
    const [view, setView] = useState('timeGridWeek');
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(),
        end: new Date()
    });

    // Filters
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

    // Filter by Role
    const { data: role } = trpc.team.myRole.useQuery();
    const { data: me } = trpc.resource.getMe.useQuery();

    // Auto-select my resource if I am STAFF
    if (role === 'STAFF' && me && selectedResourceId !== me.id) {
        setSelectedResourceId(me.id);
    }

    // Side Panel State
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const updateStatus = trpc.booking.updateStatus.useMutation({
        onSuccess: () => {
            toast({ title: "Estado actualizado", description: "La cita ha sido actualizada correctamente." });
            refetch();
            setIsSheetOpen(false);
        }
    });

    const isStarted = selectedEvent ? (selectedEvent.start ? new Date(selectedEvent.start) <= new Date() : false) : false;
    const isBooking = selectedEvent?.extendedProps?.type === 'booking';
    const status = selectedEvent?.extendedProps?.status;

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
        setSelectedEvent(info.event);
        setIsSheetOpen(true);
    };

    const renderEventContent = (eventInfo: any) => {
        const props = eventInfo.event.extendedProps;
        const isBooking = props.type === 'booking';

        let bgColor = "bg-primary";
        let borderColor = "border-primary";

        if (isBooking) {
            if (props.status === 'CANCELLED') {
                // Cancelled: Gray/Slate (unchanged or slightly adjusted)
                bgColor = "bg-slate-400";
                borderColor = "border-slate-500";
            } else if (props.status === 'PENDING') {
                // Pending: Light Gray
                bgColor = "bg-gray-400";
                borderColor = "border-gray-500";
            } else if (props.status === 'COMPLETED') {
                // Completed: Clear Green
                bgColor = "bg-green-500";
                borderColor = "border-green-600";
            } else if (props.status === 'NO_SHOW') {
                // No Show: Soft Red
                bgColor = "bg-red-400";
                borderColor = "border-red-500";
            } else {
                // Confirmed (Default): Primary
                bgColor = "bg-primary";
                borderColor = "border-primary";
            }
        } else {
            // Blockout
            bgColor = "bg-slate-400";
            borderColor = "border-slate-500";
        }

        return (
            <div
                className={`w-full h-full px-1.5 py-0.5 text-[10px] leading-tight overflow-hidden flex flex-col justify-center rounded-sm border-l-4 ${bgColor} ${borderColor} text-white cursor-pointer`}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(eventInfo.event);
                    setIsSheetOpen(true);
                }}
            >
                {/* Admin/Owner View: Service + Professional */}
                {(role === 'OWNER' || role === 'ADMIN') && (
                    <>
                        <div className="font-bold truncate text-[11px] mb-0.5">{props.serviceName}</div>
                        {props.resourceName && (
                            <div className="truncate uppercase opacity-90 mb-0.5">{props.resourceName}</div>
                        )}
                        {/* Optional: Show customer small at bottom if needed, or hide as requested "remove patient name" */}
                    </>
                )}

                {/* Staff View: Patient Name + Service */}
                {role === 'STAFF' && (
                    <>
                        <div className="font-bold truncate text-[11px] mb-0.5">{props.customerName}</div>
                        <div className="truncate opacity-90">{props.serviceName}</div>
                    </>
                )}

                {/* Fallback/Generic (if no role loaded yet or other cases) */}
                {!role && (
                    <div className="font-semibold truncate">{eventInfo.event.title}</div>
                )}

                {isBooking && props.status === 'CANCELLED' && (
                    <div className="italic text-[9px] opacity-80 truncate mt-auto">Cancelada</div>
                )}
            </div>
        );
    }

    return (
        <>
            <DashboardHeader title="Agenda" />
            <div className="flex flex-1 flex-col p-8 h-[calc(100vh-64px)]">
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
                            eventContent={renderEventContent}
                            nowIndicator
                            allDaySlot={false}
                            slotMinTime="08:00:00"
                            slotMaxTime="20:00:00"
                            height="100%"
                            eventClassNames="cursor-pointer"
                            // expandRows removed for natural scrolling
                            stickyHeaderDates
                        />
                    </CardContent>
                </Card>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[450px] p-0 flex flex-col">
                    {selectedEvent && (
                        <>
                            <SheetHeader className="p-6 border-b bg-muted/20">
                                <Badge variant={selectedEvent.extendedProps.type === 'booking' ? 'default' : 'secondary'} className="w-fit mb-2">
                                    {selectedEvent.extendedProps.type === 'booking' ? 'Cita' : 'Bloqueo'}
                                </Badge>
                                <SheetTitle className="text-xl">
                                    {selectedEvent.title}
                                </SheetTitle>
                                <SheetDescription>
                                    Detalles completos del evento en la agenda
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-8">
                                    {/* Time Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 bg-primary/10 p-2.5 rounded-xl">
                                            <Clock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70">Horario</p>
                                            <p className="text-base font-medium mt-0.5">
                                                {format(selectedEvent.start, "PPPP", { locale: es })}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {format(selectedEvent.start, "p")} - {format(selectedEvent.end, "p")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Booking Specific Info */}
                                    {selectedEvent.extendedProps.type === 'booking' && (
                                        <>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 bg-primary/10 p-2.5 rounded-xl">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70 mb-1">Cliente</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            {selectedEvent.extendedProps.customerId ? (
                                                                <Link
                                                                    href={`/dashboard/customers/${selectedEvent.extendedProps.customerId}`}
                                                                    className="text-base font-bold truncate leading-tight block text-primary hover:underline"
                                                                >
                                                                    {selectedEvent.extendedProps.customerName}
                                                                </Link>
                                                            ) : (
                                                                <p className="text-base font-bold truncate leading-tight">{selectedEvent.extendedProps.customerName}</p>
                                                            )}

                                                            <div className="flex flex-col gap-0.5 mt-1">
                                                                <div className="flex items-center justify-between group/contact">
                                                                    <a href={`mailto:${selectedEvent.extendedProps.email}`} className="text-sm text-primary hover:underline truncate flex items-center gap-1.5 font-medium">
                                                                        <Mail className="h-3 w-3" />
                                                                        {selectedEvent.extendedProps.email}
                                                                    </a>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 opacity-0 group-hover/contact:opacity-100 transition-opacity"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(selectedEvent.extendedProps.email);
                                                                            toast({ title: "Copiado", description: "Correo copiado" });
                                                                        }}
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </div>

                                                                {selectedEvent.extendedProps.phone && (
                                                                    <div className="flex items-center justify-between group/contact">
                                                                        <a href={`tel:${selectedEvent.extendedProps.phone}`} className="text-sm text-primary hover:underline truncate flex items-center gap-1.5 font-medium">
                                                                            <PhoneCall className="h-3 w-3" />
                                                                            {selectedEvent.extendedProps.phone}
                                                                        </a>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover/contact:opacity-100 transition-opacity"
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(selectedEvent.extendedProps.phone);
                                                                                toast({ title: "Copiado", description: "Teléfono copiado" });
                                                                            }}
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 bg-primary/10 p-2.5 rounded-xl">
                                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70">Servicio</p>
                                                    <p className="text-base font-medium mt-0.5">{selectedEvent.extendedProps.serviceName}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Resource Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 bg-primary/10 p-2.5 rounded-xl">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70">Profesional Asignado</p>
                                            <p className="text-base font-medium mt-0.5">{selectedEvent.extendedProps.resourceName}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    {selectedEvent.extendedProps.status && (
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 bg-primary/10 p-2.5 rounded-xl">
                                                <RefreshCw className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70">Estado de la Cita</p>
                                                <Badge variant="outline" className="mt-1 font-bold px-3 py-1 uppercase text-[10px] tracking-widest">
                                                    {selectedEvent.extendedProps.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t bg-muted/5 mt-auto space-y-3">
                                {isBooking && isStarted && status !== 'COMPLETED' && status !== 'NO_SHOW' && (
                                    <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-muted">
                                        <Button
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl flex items-center gap-2"
                                            onClick={() => updateStatus.mutate({ id: selectedEvent.extendedProps.originalId, status: 'COMPLETED' })}
                                            disabled={updateStatus.isPending}
                                        >
                                            <CheckCircle className="h-5 w-5" />
                                            Asistió
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 font-bold h-12 rounded-xl flex items-center gap-2"
                                            onClick={() => updateStatus.mutate({ id: selectedEvent.extendedProps.originalId, status: 'NO_SHOW' })}
                                            disabled={updateStatus.isPending}
                                        >
                                            <XCircle className="h-5 w-5" />
                                            No asistió
                                        </Button>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 gap-2 font-bold py-6 rounded-xl transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                                        <Edit className="h-4 w-4" /> Editar Evento
                                    </Button>
                                    <Button variant="destructive" className="flex-1 gap-2 font-bold py-6 rounded-xl transition-all shadow-lg shadow-destructive/10">
                                        <Trash2 className="h-4 w-4" /> Eliminar
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
