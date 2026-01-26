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

    console.log('RescheduleWizard: Rendering with token:', token);

    const isSitePreview = pathname.startsWith('/sites');
    const homeUrl = isSitePreview ? `/sites/${companySlug}/` : '/';

    // Queries
    // 1. Get Booking Details
    const { data: booking, isLoading: bookingLoading, isError: bookingError, error } = trpc.booking.getByRescheduleToken.useQuery({ token }, {
        retry: false
    });

    if (booking) console.log('RescheduleWizard: Booking loaded:', booking);
    if (bookingError) console.error('RescheduleWizard: Booking error:', error);

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
            <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in duration-300">
                <Card className="shadow-lg border-green-100">
                    <CardContent className="pt-12 text-center space-y-6">
                        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900">¡Cita Reagendada!</h3>
                            <p className="text-slate-600">
                                Tu cita ha sido actualizada exitosamente.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl space-y-3 max-w-sm mx-auto">
                            <div className="flex items-center gap-3 text-slate-700">
                                <CalendarIcon className="h-5 w-5 opacity-70" />
                                <span className="font-semibold">{format(new Date(rescheduleMutation.data?.startTime || new Date()), "d 'de' MMMM, yyyy", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <Clock className="h-5 w-5 opacity-70" />
                                <span className="font-semibold">{format(new Date(rescheduleMutation.data?.startTime || new Date()), "HH:mm", { locale: es })}</span>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 px-8">
                            Hemos enviado un nuevo correo de confirmación con los detalles actualizados y la invitación de calendario.
                        </p>

                        <CardFooter className="flex justify-center pb-8 pt-4">
                            <Button className="px-8" style={{ backgroundColor: brandingColor }} onClick={() => window.location.href = homeUrl}>
                                Volver al inicio
                            </Button>
                        </CardFooter>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <Card className="shadow-xl border-slate-200">
                <CardHeader className="space-y-3 border-b bg-slate-50/50 rounded-t-xl">
                    <CardTitle className="text-2xl" style={{ color: brandingColor }}>
                        Reagendar mi Cita
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-base">
                        Hola <strong className="text-slate-900">{booking.customerName}</strong>, elige un nuevo horario para tu servicio de <strong className="text-slate-900">{(booking as any).service?.name || 'servicio'}</strong>.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    {/* Current Appointment Banner */}
                    <div className="bg-slate-50 border-l-4 p-5 rounded-r-xl border-slate-300 flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Clock className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cita actual:</p>
                            <p className="text-lg font-semibold text-slate-800">
                                {format(new Date(booking.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white hover:bg-slate-50 shadow-sm"
                                onClick={() => setSelectedDate(d => addDays(d, -1))}
                                disabled={isSameDay(selectedDate, startOfToday())}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="font-bold text-slate-700 capitalize">
                                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white hover:bg-slate-50 shadow-sm"
                                onClick={() => setSelectedDate(d => addDays(d, 1))}
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {slotsLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
                                <p className="text-sm text-slate-400 animate-pulse">Buscando horarios disponibles...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {slots?.map((slot: any, idx: number) => {
                                    const slotString = JSON.stringify(slot);
                                    const isSelected = selectedSlot === slotString;
                                    return (
                                        <Button
                                            key={idx}
                                            variant={isSelected ? "default" : "outline"}
                                            className={`py-6 text-lg font-medium transition-all ${isSelected ? 'scale-105 shadow-md ring-2 ring-offset-2' : 'hover:border-slate-400'}`}
                                            onClick={() => handleSlotSelect(slotString)}
                                            style={isSelected ? { backgroundColor: brandingColor } : {}}
                                        >
                                            {format(new Date(slot.start), 'HH:mm')}
                                        </Button>
                                    );
                                })}
                                {slots?.length === 0 && (
                                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">No hay horarios disponibles para este día.</p>
                                        <p className="text-sm text-slate-400 mt-1">Intenta con otra fecha.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between border-t bg-slate-50/50 p-6 rounded-b-xl mt-4">
                    <div className="text-sm text-slate-500 max-w-xs italic">
                        Al reagendar, liberaremos tu espacio anterior para otros clientes.
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={rescheduleMutation.isPending || !selectedSlot}
                        style={selectedSlot ? { backgroundColor: brandingColor } : {}}
                        className="w-full sm:w-auto px-10 py-6 text-lg font-bold shadow-lg"
                        size="lg"
                    >
                        {rescheduleMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Confirmar Cambio
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
