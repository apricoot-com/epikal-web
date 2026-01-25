"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Clock, Calendar as CalendarIcon, Plus, X, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function MyProfilePage() {
    const utils = trpc.useUtils();
    const { data: professional, isLoading } = trpc.resource.getMe.useQuery();

    const updateResource = trpc.resource.update.useMutation();
    const updateAvailability = trpc.resource.updateAvailability.useMutation();
    const addBlockout = trpc.resource.addBlockout.useMutation({
        onSuccess: () => {
            utils.resource.getMe.invalidate();
            toast.success("Excepción añadida");
            setNewBlockout({ description: "", startTime: "", endTime: "" });
        }
    });
    const removeBlockout = trpc.resource.removeBlockout.useMutation({
        onSuccess: () => {
            utils.resource.getMe.invalidate();
            toast.success("Excepción eliminada");
        }
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: "",
    });

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
            setFormData({
                name: professional.name,
                description: professional.description || "",
                image: professional.image || "",
            });

            // Ensure availabilitySlots always contains all 7 days
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
        if (!professional) return;

        try {
            await updateResource.mutateAsync({
                id: professional.id,
                name: formData.name,
                description: formData.description || null,
                image: formData.image || null,
            });

            await updateAvailability.mutateAsync({
                resourceId: professional.id,
                slots: availabilitySlots.map(({ dayOfWeek, startTime, endTime, isAvailable }) => ({
                    dayOfWeek,
                    startTime,
                    endTime,
                    isAvailable
                }))
            });

            utils.resource.getMe.invalidate();
            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            toast.error("Error al actualizar el perfil");
        }
    };

    const updateSlot = (dayId: string, updates: any) => {
        setAvailabilitySlots(prev =>
            prev.map(slot => slot.dayOfWeek === dayId ? { ...slot, ...updates } : slot)
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <DashboardHeader title="Mi Perfil" />
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
                <DashboardHeader title="Mi Perfil" />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="size-5 text-muted-foreground" />
                            Sin perfil profesional
                        </CardTitle>
                        <CardDescription>
                            Su cuenta de usuario no está vinculada a un perfil profesional en esta empresa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Pida a un administrador que lo vincule a un profesional para poder gestionar su disponibilidad y excepciones.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <DashboardHeader title="Mi Perfil Profesional">
                <Button
                    onClick={handleSaveAll}
                    disabled={updateResource.isPending || updateAvailability.isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {updateResource.isPending || updateAvailability.isPending
                        ? "Guardando..."
                        : "Guardar cambios"}
                </Button>
            </DashboardHeader>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="general">Información General</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
                        <TabsTrigger value="blockouts">Horas No Disponibles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                                <CardDescription>
                                    Sus datos públicos en la agenda y sitio web
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                    <Label htmlFor="name">Nombre Público *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="Ej. Dr. Juan Pérez"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción / Especialidad</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Ej. Fisioterapeuta especialista en..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="availability" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle>Horario de Trabajo</CardTitle>
                                        <CardDescription>
                                            Define los días y horas semanales en los que estás disponible para recibir citas.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {DAYS.map((day) => {
                                        const slot = availabilitySlots.find(s => s.dayOfWeek === day.id);
                                        if (!slot) return null;

                                        return (
                                            <div
                                                key={day.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${slot.isAvailable ? "bg-card border-border" : "bg-muted/30 border-dashed opacity-70"
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
                    </TabsContent>

                    <TabsContent value="blockouts" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle>Indisponibilidad Puntual</CardTitle>
                                        <CardDescription>
                                            Agregue excepciones para días específicos donde no estará disponible (Vacaciones, citas médicas, etc.)
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Blockout Form */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl border border-dashed">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Descripción</Label>
                                        <Input
                                            placeholder="Ej: Cita Médica"
                                            value={newBlockout.description}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, description: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Desde</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newBlockout.startTime}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, startTime: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Hasta</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newBlockout.endTime}
                                            onChange={(e) => setNewBlockout({ ...newBlockout, endTime: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="secondary"
                                            className="w-full gap-2"
                                            disabled={!newBlockout.startTime || !newBlockout.endTime || addBlockout.isPending}
                                            onClick={() => addBlockout.mutate({
                                                resourceId: professional.id,
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
                                    <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/70">Próximas Excepciones</p>

                                    {professional.blockouts?.map((b: any) => (
                                        <div key={b.id} className="flex items-center justify-between p-4 bg-card rounded-xl border group hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/5 p-2 rounded-lg">
                                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{b.description || "Bloqueo puntual"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(b.startTime), "PPp", { locale: es })} — {format(new Date(b.endTime), "PPp", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => removeBlockout.mutate({ id: b.id })}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {(!professional.blockouts || professional.blockouts.length === 0) && (
                                        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">No hay indisponibilidad puntual programada.</p>
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
