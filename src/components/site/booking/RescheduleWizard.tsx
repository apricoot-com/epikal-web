'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { trpc } from '@/src/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, Check, Users } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface RescheduleWizardProps {
    token: string;
    companySlug: string;
}

export default function RescheduleWizard({ token, companySlug }: RescheduleWizardProps) {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const pathname = usePathname();

    const isSitePreview = pathname.startsWith('/sites');
    const homeUrl = isSitePreview ? `/sites/${companySlug}/` : '/';

    // Queries
    // 1. Get Booking Details
    const { data: booking, isLoading: bookingLoading, isError: bookingError } = trpc.booking.getByRescheduleToken.useQuery({ token }, {
        retry: false
    });

    // 2. Get Available Slots (only if booking is loaded)
    const { data: slots, isLoading: slotsLoading } = trpc.booking.getSlots.useQuery({
        serviceId: booking?.serviceId || '',
        startDate: selectedDate.toISOString(),
        endDate: addDays(selectedDate, 1).toISOString(),
        resourceId: booking?.resourceId
    }, {
        enabled: !!booking && !isConfirmed
    });

    // Mutations
    const rescheduleMutation = trpc.booking.reschedule.useMutation({
        onSuccess: () => {
            setIsConfirmed(true);
        },
        onError: (err) => {
            toast({
                variant: "destructive",
                title: "Error al reagendar",
                description: err.message
            });
        }
    });

    // Handlers
    const handleSlotSelect = (slot: string) => {
        setSelectedSlot(slot);
    };

    const handleSubmit = () => {
        if (!selectedSlot) return;
        rescheduleMutation.mutate({
            token,
            newStartTime: JSON.parse(selectedSlot).start
        });
    };

    if (bookingLoading && !booking) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (bookingError || !booking) {
        return (
            <Card className="max-w-md mx-auto mt-12 shadow-lg border-red-100">
                <CardHeader>
                    <CardTitle className="text-destructive text-center flex items-center justify-center gap-2">
                        Enlace Inválido
                    </CardTitle>
                    <CardDescription className="text-center">
                        Este enlace de reagendamiento no es válido, ya ha sido utilizado o ha expirado.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center pb-8">
                    <Button onClick={() => window.location.href = homeUrl} variant="outline">Volver al inicio</Button>
                </CardFooter>
            </Card>
        );
    }

    const brandingColor = (booking as any).company?.branding?.primaryColor || '#000000';

    if (isConfirmed) {
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: brandingColor }}>
                            ¡Cita Reagendada!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8 space-y-4">
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">¡Nueva fecha confirmada!</h3>
                        <p className="text-muted-foreground">
                            Tu cita ha sido actualizada exitosamente para el <strong>{format(new Date(rescheduleMutation.data?.startTime || new Date()), "d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Hemos enviado un nuevo correo de confirmación con los detalles actualizados.
                        </p>
                        <Button
                            className="mt-4"
                            style={{ backgroundColor: brandingColor }}
                            onClick={() => window.location.href = homeUrl}
                        >
                            Volver al inicio
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle style={{ color: brandingColor }}>
                        Reagendar mi Cita
                    </CardTitle>
                    <CardDescription>
                        Hola {booking.customerName}, elige un nuevo horario para tu servicio de {(booking as any).service?.name || 'servicio'}.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Current Appointment Banner */}
                    <div className="bg-slate-50 border-l-4 p-4 rounded-r-md mb-6" style={{ borderColor: brandingColor }}>
                        <p className="text-sm font-medium text-slate-600">Cita actual:</p>
                        <p className="font-semibold text-slate-900">
                            {format(new Date(booking.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Date Navigation */}
                        <div className="flex items-center justify-between">
                            <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => addDays(d, -1))} disabled={isSameDay(selectedDate, startOfToday())}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="font-medium">
                                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => addDays(d, 1))}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Slots Grid */}
                        {slotsLoading ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {slots?.map((slot: any, idx: number) => {
                                    const slotString = JSON.stringify(slot);
                                    const isSelected = selectedSlot === slotString;
                                    return (
                                        <Button
                                            key={idx}
                                            variant={isSelected ? "default" : "outline"}
                                            className="w-full"
                                            onClick={() => handleSlotSelect(slotString)}
                                            style={isSelected ? { backgroundColor: brandingColor } : {}}
                                        >
                                            {format(new Date(slot.start), 'HH:mm')}
                                        </Button>
                                    );
                                })}
                                {slots?.length === 0 && (
                                    <div className="col-span-3 text-center text-muted-foreground py-4">
                                        No hay horarios disponibles para este día.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end border-top pt-6">
                    <Button
                        onClick={handleSubmit}
                        disabled={rescheduleMutation.isPending || !selectedSlot}
                        style={selectedSlot ? { backgroundColor: brandingColor } : {}}
                    >
                        {rescheduleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmar Cambio
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
