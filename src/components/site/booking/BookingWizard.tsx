'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trpc } from '@/src/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingWizardProps {
    companySlug: string;
    preselectedServiceId?: string;
    preselectedResourceId?: string;
    callbackUrl?: string;
}

type Step = 'service' | 'professional' | 'time' | 'details' | 'confirmation';

export default function BookingWizard({
    companySlug,
    preselectedServiceId,
    preselectedResourceId,
    callbackUrl
}: BookingWizardProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>('service');
    const pathname = usePathname();

    const isSitePreview = pathname.startsWith('/sites');
    const homeUrl = isSitePreview ? `/sites/${companySlug}/` : '/';

    // Selection State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedResource, setSelectedResource] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Queries
    // 1. Get Company & Services
    const { data: companyData, isLoading: companyLoading } = trpc.company.getPublicData.useQuery({ slug: companySlug });

    // 2. Get Available Slots (only when needed)
    const { data: slots, isLoading: slotsLoading } = trpc.booking.getSlots.useQuery({
        serviceId: selectedService?.id,
        startDate: selectedDate.toISOString(),
        endDate: addDays(selectedDate, 1).toISOString(), // Fetch 1 day for now, UI should handle range
        resourceId: selectedResource?.id
    }, {
        enabled: step === 'time' && !!selectedService
    });

    // Mutations
    const createBooking = trpc.booking.create.useMutation({
        onSuccess: () => {
            setStep('confirmation');
        },
        onError: (err) => {
            toast({
                variant: "destructive",
                title: "Error al agendar",
                description: err.message
            });
        }
    });

    // Effect: Handle Pre-selection
    useEffect(() => {
        if (companyData && !selectedService) {
            if (preselectedServiceId) {
                const s = companyData.services.find((s: any) => s.id === preselectedServiceId);
                if (s) {
                    setSelectedService(s);
                    // Determine next step
                    if (preselectedResourceId) {
                        setStep('time');
                    } else {
                        setStep('professional');
                    }
                }
            } else if (companyData.services.length === 1) {
                setSelectedService(companyData.services[0]);
                setStep('professional');
            }
        }
    }, [companyData, preselectedServiceId, preselectedResourceId, selectedService]);

    // Handlers
    const handleServiceSelect = (service: any) => {
        setSelectedService(service);
        // Default to 'any' professional logic -> Skip professional step if unwanted?
        // Architecture says: "Select Professional (Optional/Required based on config)"
        // For now, let's always show it unless only 1 or skipped.
        setStep('professional');
    };

    const handleResourceSelect = (resource: any) => {
        setSelectedResource(resource); // null means "Any"
        setStep('time');
    };

    const handleSlotSelect = (slot: string) => {
        setSelectedSlot(slot);
        setStep('details');
    };

    const handleSubmit = () => {
        if (!selectedService || !selectedSlot) return;

        createBooking.mutate({
            siteId: companySlug,
            serviceId: selectedService.id,
            resourceId: selectedResource?.id || JSON.parse(selectedSlot).resourceId, // Slot object should contain assigned resource
            startTime: JSON.parse(selectedSlot).start,
            customer: form
        });
    };

    if (companyLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!companyData) return <div className="p-8 text-center">Empresa no encontrada</div>;

    const BrandingColor = companyData.branding?.primaryColor || '#000000';

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle style={{ color: BrandingColor }}>
                        {step === 'confirmation' ? '¡Reserva Confirmada!' : companyData.name}
                    </CardTitle>
                    <CardDescription>
                        {step === 'service' && "Selecciona un servicio"}
                        {step === 'professional' && "Selecciona un profesional"}
                        {step === 'time' && "Elige fecha y hora"}
                        {step === 'details' && "Tus datos de contacto"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* STEP 1: SERVICE */}
                    {step === 'service' && (
                        <div className="grid gap-4">
                            {companyData.services.map((service: any) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors text-left"
                                >
                                    <div>
                                        <div className="font-semibold">{service.name}</div>
                                        <div className="text-sm text-muted-foreground">{service.duration} min • ${service.price}</div>
                                        {service.description && (
                                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</div>
                                        )}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: PROFESSIONAL */}
                    {step === 'professional' && (
                        <div className="grid gap-4">
                            {/* Option: Any Professional */}
                            <button
                                onClick={() => handleResourceSelect(null)}
                                className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <UsersIcon />
                                </div>
                                <div className="font-semibold">Cualquier profesional disponible</div>
                            </button>

                            {/* List resources for this service */}
                            {selectedService?.resources?.map((sr: any) => (
                                <button
                                    key={sr.resourceId}
                                    onClick={() => handleResourceSelect(sr.resource)}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
                                >
                                    {/* Avatar placeholder */}
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                        {sr.resource.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{sr.resource.name}</div>
                                        {sr.resource.description && (
                                            <div className="text-xs text-muted-foreground">{sr.resource.description}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: TIME */}
                    {step === 'time' && (
                        <div className="space-y-6">
                            {/* Date Navigation (Simplified) */}
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
                                    {slots?.map((slot: any, idx: number) => (
                                        <Button
                                            key={idx}
                                            variant={selectedSlot === JSON.stringify(slot) ? "default" : "outline"}
                                            className="w-full"
                                            onClick={() => handleSlotSelect(JSON.stringify(slot))}
                                            style={selectedSlot === JSON.stringify(slot) ? { backgroundColor: BrandingColor } : {}}
                                        >
                                            {format(new Date(slot.start), 'HH:mm')}
                                        </Button>
                                    ))}
                                    {slots?.length === 0 && (
                                        <div className="col-span-3 text-center text-muted-foreground py-4">
                                            No hay horarios disponibles para este día.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: DETAILS */}
                    {step === 'details' && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 123 4567" />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-md mt-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Servicio:</span>
                                    <span className="font-medium">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span className="font-medium">{selectedSlot && format(new Date(JSON.parse(selectedSlot).start), "d MMMM, yyyy - HH:mm", { locale: es })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Precio:</span>
                                    <span className="font-medium">${selectedService.price}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: CONFIRMATION */}
                    {step === 'confirmation' && (
                        <div className="text-center py-8 space-y-4">
                            <div className={`mx-auto h-16 w-16 ${createBooking.data?.status === 'PENDING' ? 'bg-amber-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                                {createBooking.data?.status === 'PENDING' ? (
                                    <Clock className="h-8 w-8 text-amber-600" />
                                ) : (
                                    <Check className="h-8 w-8 text-green-600" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold">
                                {createBooking.data?.status === 'PENDING' ? '¡Ya casi terminamos!' : '¡Cita Agendada!'}
                            </h3>
                            <p className="text-muted-foreground">
                                {createBooking.data?.status === 'PENDING'
                                    ? `Hemos enviado un link de confirmación a ${form.email}. Debes hacer click en él para asegurar tu cita.`
                                    : `Hemos enviado un correo de confirmación a ${form.email}.`}
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => {
                                    if (callbackUrl) {
                                        window.location.href = callbackUrl;
                                    } else {
                                        window.location.href = homeUrl;
                                    }
                                }}
                            >
                                {callbackUrl ? "Regresar" : "Volver al inicio"}
                            </Button>
                        </div>
                    )}
                </CardContent>

                {step !== 'confirmation' && (
                    <CardFooter className="flex justify-between">
                        {step !== 'service' ? (
                            <Button variant="ghost" onClick={() => {
                                if (step === 'professional') setStep('service');
                                if (step === 'time') setStep('professional');
                                if (step === 'details') setStep('time');
                            }}>
                                Atrás
                            </Button>
                        ) : <div></div>}

                        {step === 'details' && (
                            <Button
                                onClick={handleSubmit}
                                disabled={createBooking.isPending || !form.name || !form.email}
                                style={{ backgroundColor: BrandingColor }}
                            >
                                {createBooking.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirmar Reserva
                            </Button>
                        )}
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

function UsersIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    )
}
