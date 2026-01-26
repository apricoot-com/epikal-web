'use client';

import { useState } from 'react';
import { trpc } from '@/src/utils/trpc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface CancelWizardProps {
    token: string;
}

export default function CancelWizard({ token }: CancelWizardProps) {
    const [isCancelled, setIsCancelled] = useState(false);

    // 1. Get Booking Details
    const { data: booking, isLoading, isError } = trpc.booking.getByCancelToken.useQuery({ token }, {
        retry: false
    });

    // 2. Cancellation Mutation
    const cancelMutation = trpc.booking.cancelByToken.useMutation({
        onSuccess: () => {
            setIsCancelled(true);
        }
    });

    const handleCancel = () => {
        cancelMutation.mutate({ token });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (isError || !booking) {
        return (
            <div className="max-w-md mx-auto p-4">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Enlace inválido
                        </CardTitle>
                        <CardDescription className="text-red-600">
                            El enlace para cancelar la cita es inválido o ha expirado.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const brandingColor = (booking as any).company?.branding?.primaryColor || '#000000';
    const logoUrl = (booking as any).company?.branding?.logoUrl;
    const companySlug = (booking as any).company?.slug;

    // Check if already cancelled
    if (booking.status === 'CANCELLED' || isCancelled) {
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-slate-500" />
                        </div>
                        <CardTitle className="text-center text-xl">
                            Cita Cancelada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            La cita ha sido cancelada exitosamente.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-md inline-block text-left w-full max-w-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-700">
                                    {format(new Date(booking.startTime), "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-700">
                                    {format(new Date(booking.startTime), "HH:mm", { locale: es })}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-4">
                            Si cambias de opinión, tendrás que agendar una nueva cita.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button
                            onClick={() => window.location.href = `/sites/${companySlug}`}
                            variant="outline"
                        >
                            Volver al inicio
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="text-center border-b bg-slate-50/50 rounded-t-xl pb-6">
                    {logoUrl && (
                        <div className="mx-auto mb-4 relative h-12 w-32">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                    )}
                    <CardTitle className="text-2xl text-slate-900">
                        ¿Cancelar Cita?
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Hola <strong>{booking.customerName}</strong>, estás a punto de cancelar tu cita.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-6">
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-xl space-y-4 text-center">
                        <h3 className="font-semibold text-slate-900 text-lg">Detalles de la Cita</h3>

                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 text-slate-700 text-lg">
                                <CalendarIcon className="h-5 w-5 text-slate-400" />
                                <span className="font-medium capitalize">
                                    {format(new Date(booking.startTime), "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 text-lg">
                                <Clock className="h-5 w-5 text-slate-400" />
                                <span className="font-medium">
                                    {format(new Date(booking.startTime), "HH:mm", { locale: es })}
                                </span>
                            </div>
                            <div className="text-slate-500 mt-1">
                                Servicio: {(booking as any).service?.name}
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            Esta acción no se puede deshacer. Si cancelas, perderás tu reserva actual.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t bg-slate-50/30">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => window.history.back()}
                    >
                        No, mantener cita
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full sm:w-auto sm:ml-auto"
                        onClick={handleCancel}
                        disabled={cancelMutation.isPending}
                    >
                        {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Si, cancelar cita
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
