"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, Clock, Calendar as CalendarIcon, Plus, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function ProfessionalEditPage() {
    const params = useParams();
    const router = useRouter();
    const professionalId = params.id as string;

    const { data: professional, isLoading } = trpc.resource.get.useQuery({
        id: professionalId,
    });
    const { data: locations } = trpc.location.list.useQuery();
    const { data: services } = trpc.service.list.useQuery();

    const updateResource = trpc.resource.update.useMutation();
    const assignServices = trpc.resource.assignServices.useMutation();
    const updateAvailability = trpc.resource.updateAvailability.useMutation();
    const addBlockout = trpc.resource.addBlockout.useMutation({
        onSuccess: () => {
            utils.resource.get.invalidate({ id: professionalId });
            toast.success("Excepción añadida");
            setNewBlockout({ description: "", startTime: "", endTime: "" });
        }
    });
    const removeBlockout = trpc.resource.removeBlockout.useMutation({
        onSuccess: () => {
            utils.resource.get.invalidate({ id: professionalId });
            toast.success("Excepción eliminada");
        }
    });
    const utils = trpc.useUtils();
    const deleteResource = trpc.resource.delete.useMutation({
        onSuccess: () => {
            toast.success("Profesional desactivado");
            router.push("/dashboard/services/team");
        }
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        locationId: "",
        status: "ACTIVE" as "ACTIVE" | "INACTIVE",
        image: "",
    });

    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
    const [newBlockout, setNewBlockout] = useState({
        description: "",
        startTime: "",
        endTime: ""
    });

    const DAYS = [
        { id: "MONDAY", label: "Lunes" },
        { id: "TUESDAY", label: "Martes" },
        { id: "WEDNESDAY", label: "Miércoles" },
        { id: "THURSDAY", label: "Jueves" },
        { id: "FRIDAY", label: "Viernes" },
        { id: "SATURDAY", label: "Sábado" },
        { id: "SUNDAY", label: "Domingo" },
    ];

    const TIME_OPTIONS = Array.from({ length: 24 * 2 }).map((_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}:${minute}`;
    });

    useEffect(() => {
        if (professional) {
            const prof = professional as any;
            setFormData({
                name: prof.name,
                description: prof.description || "",
                locationId: prof.locationId || "none",
                status: prof.status,
                image: prof.image || "",
            });
            setSelectedServiceIds(
                prof.services.map((s: any) => s.service.id)
            );

            // Fix: Ensure availabilitySlots always contains all 7 days
            const existingSlots = professional.availability || [];
            const mergedSlots = DAYS.map(day => {
                const existing = existingSlots.find((s: any) => s.dayOfWeek === day.id);
                if (existing) return existing;
                return {
                    dayOfWeek: day.id as any,
                    startTime: "09:00",
                    endTime: "18:00",
                    isAvailable: ["SATURDAY", "SUNDAY"].includes(day.id) ? false : true
                };
            });
            setAvailabilitySlots(mergedSlots);
        }
    }, [professional]);

    const handleSaveAll = async () => {
        await updateResource.mutateAsync({
            id: professionalId,
            name: formData.name,
            description: formData.description || null,
            locationId: formData.locationId === "none" ? null : formData.locationId || null,
            status: formData.status,
            image: formData.image || null,
        });

        await assignServices.mutateAsync({
            resourceId: professionalId,
            serviceIds: selectedServiceIds,
        });

        await updateAvailability.mutateAsync({
            resourceId: professionalId,
            slots: availabilitySlots.map(({ dayOfWeek, startTime, endTime, isAvailable }) => ({
                dayOfWeek,
                startTime,
                endTime,
                isAvailable
            }))
        });

        toast.success("Todos los cambios han sido guardados");
    };

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const updateSlot = (dayId: string, updates: any) => {
        setAvailabilitySlots(prev =>
            prev.map(slot => slot.dayOfWeek === dayId ? { ...slot, ...updates } : slot)
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <DashboardHeader title="Cargando..." />
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (!professional) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <DashboardHeader title="No encontrado" />
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            El profesional no fue encontrado.
                        </p>
                        <div className="flex justify-center mt-4">
                            <Button asChild>
                                <Link href="/dashboard/services/team">
                                    Volver al listado
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <DashboardHeader
                title={`Editar: ${professional.name}`}
                backHref="/dashboard/services/team"
            >
                <Button
                    onClick={handleSaveAll}
                    disabled={updateResource.isPending || assignServices.isPending || updateAvailability.isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {updateResource.isPending || assignServices.isPending || updateAvailability.isPending
                        ? "Guardando..."
                        : "Guardar cambios"}
                </Button>
            </DashboardHeader>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="general">Información General</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información Básica</CardTitle>
                                    <CardDescription>
                                        Datos generales del profesional
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-4">
                                        <Label>Foto de perfil</Label>
                                        <ImageUpload
                                            value={formData.image}
                                            onChange={(url) => setFormData({ ...formData, image: url })}
                                            onRemove={() => setFormData({ ...formData, image: "" })}
                                            folder="profiles"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Dr. García / Dra. Pérez"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descripción / Título</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Dermatóloga, Fisioterapeuta..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                                                setFormData({ ...formData, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Activo</SelectItem>
                                                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Ubicación</CardTitle>
                                    <CardDescription>
                                        Ubicación principal donde trabaja
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Ubicación Principal</Label>
                                        <Select
                                            value={formData.locationId}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, locationId: v })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona ubicación" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin ubicación fija</SelectItem>
                                                {locations?.map((loc: any) => (
                                                    <SelectItem key={loc.id} value={loc.id}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {professional.location && (
                                        <div className="p-3 bg-muted rounded-md border text-sm">
                                            <p className="font-medium">Ubicación actual:</p>
                                            <p className="text-muted-foreground">
                                                {professional.location.name}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Servicios Asignados</CardTitle>
                                <CardDescription>
                                    Selecciona los servicios que puede prestar este profesional
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {services?.map((service: any) => (
                                        <label
                                            key={service.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${selectedServiceIds.includes(service.id) ? "bg-primary/5 border-primary/30" : "bg-card"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedServiceIds.includes(service.id)}
                                                onChange={() => toggleService(service.id)}
                                                className="h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">
                                                {service.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {(!services || services.length === 0) && (
                                    <p className="text-center text-muted-foreground py-12">
                                        No hay servicios disponibles. Crea servicios primero.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/30 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive text-base">Zona de Peligro</CardTitle>
                                <CardDescription>
                                    Acciones de impacto sobre este profesional
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Desactivar profesional
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                ¿Desactivar profesional?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                &quot;{professional.name}&quot; será marcado como
                                                inactivo y no aparecerá en el sistema de reservas.
                                                Esta acción se puede revertir cambiando el estado.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    deleteResource.mutate({ id: professionalId })
                                                }
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Desactivar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="availability">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle>Horario de Trabajo</CardTitle>
                                        <CardDescription>
                                            Define los días y horas en los que este profesional está disponible para recibir citas.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {DAYS.map((day) => {
                                        const slot = availabilitySlots.find(s => s.dayOfWeek === day.id);
                                        if (!slot) return null;

                                        return (
                                            <div
                                                key={day.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all mb-2 ${slot.isAvailable ? "bg-card border-border" : "bg-muted/30 border-dashed opacity-70"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                                    <Switch
                                                        checked={slot.isAvailable}
                                                        onCheckedChange={(val) => updateSlot(day.id, { isAvailable: val })}
                                                    />
                                                    <span className={`font-semibold min-w-24 ${slot.isAvailable ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {day.label}
                                                    </span>
                                                </div>

                                                {slot.isAvailable ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col gap-1">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Entrada</Label>
                                                            <Select
                                                                value={slot.startTime}
                                                                onValueChange={(val) => updateSlot(day.id, { startTime: val })}
                                                            >
                                                                <SelectTrigger className="w-32 h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {TIME_OPTIONS.map(time => (
                                                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <span className="mt-5 text-muted-foreground">—</span>
                                                        <div className="flex flex-col gap-1">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Salida</Label>
                                                            <Select
                                                                value={slot.endTime}
                                                                onValueChange={(val) => updateSlot(day.id, { endTime: val })}
                                                            >
                                                                <SelectTrigger className="w-32 h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {TIME_OPTIONS.map(time => (
                                                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground italic px-4 py-2 bg-muted rounded-lg">
                                                        No disponible / Descanso
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Excepciones / Días Libres */}
                        <Card className="mt-8">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle>Excepciones y Días Libres</CardTitle>
                                        <CardDescription>
                                            Agrega fechas específicas donde el profesional no estará disponible (Vacaciones, Festivos, etc.)
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Blockout Form */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl border border-dashed hover:border-primary/30 transition-all">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Descripción</Label>
                                        <Input
                                            placeholder="Ej: Vacaciones, Festivo..."
                                            value={newBlockout.description}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, description: e.target.value })}
                                            className="bg-background h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Desde</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newBlockout.startTime}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, startTime: e.target.value })}
                                            className="bg-background h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Hasta</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newBlockout.endTime}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, endTime: e.target.value })}
                                            className="bg-background h-10"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="secondary"
                                            className="w-full gap-2 font-bold h-10"
                                            disabled={!newBlockout.startTime || !newBlockout.endTime || addBlockout.isPending}
                                            onClick={() => addBlockout.mutate({
                                                resourceId: professionalId,
                                                description: newBlockout.description,
                                                startTime: new Date(newBlockout.startTime),
                                                endTime: new Date(newBlockout.endTime)
                                            })}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Añadir
                                        </Button>
                                    </div>
                                </div>

                                {/* List Blockouts */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70 mb-2">Próximas Excepciones</p>

                                    {professional.blockouts?.map((b: any) => (
                                        <div key={b.id} className="flex items-center justify-between p-4 bg-card rounded-xl border group hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/5 p-2 rounded-lg">
                                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{b.description || "Día Libre / Bloqueo"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(b.startTime), "PPp", { locale: es })} — {format(new Date(b.endTime), "PPp", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                onClick={() => removeBlockout.mutate({ id: b.id })}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {(!professional.blockouts || professional.blockouts.length === 0) && (
                                        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">No hay excepciones programadas.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
