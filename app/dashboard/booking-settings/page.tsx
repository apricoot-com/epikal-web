
"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Clock,
    Trash2,
    Bell,
    Play
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function BookingSettingsPage() {
    const { data: company, isLoading: isLoadingCompany, refetch: refetchCompany } = trpc.company.get.useQuery();
    const { data: myRole } = trpc.team.myRole.useQuery();

    // Mutation for company settings
    const updateCompany = trpc.company.update.useMutation({
        onSuccess: () => {
            toast.success("Configuración actualizada");
            refetchCompany();
        },
    });

    // Reminders State
    const { data: reminders, refetch: refetchReminders, isLoading: isLoadingReminders } = trpc.reminder.list.useQuery();
    const createReminder = trpc.reminder.create.useMutation({
        onSuccess: () => {
            toast.success("Recordatorio creado");
            refetchReminders();
            setReminderDialogOpen(false);
            setReminderForm({ channel: "EMAIL", timeValue: 24, timeUnit: "HOURS" });
        }
    });
    const deleteReminder = trpc.reminder.delete.useMutation({
        onSuccess: () => {
            toast.success("Recordatorio eliminado");
            refetchReminders();
        }
    });
    const toggleReminder = trpc.reminder.toggle.useMutation({
        onSuccess: () => refetchReminders()
    });

    const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
    const [reminderForm, setReminderForm] = useState<{
        channel: "EMAIL" | "WHATSAPP" | "SMS";
        timeValue: number;
        timeUnit: "MINUTES" | "HOURS" | "DAYS";
    }>({
        channel: "EMAIL",
        timeValue: 24,
        timeUnit: "HOURS"
    });

    const handleCreateReminder = async () => {
        await createReminder.mutateAsync(reminderForm);
    };

    const handleTestRun = async () => {
        if (!confirm("Esto forzará el envío de recordatorios para citas próximas. ¿Continuar?")) return;

        const toastId = toast.loading("Ejecutando cron de recordatorios...");
        try {
            const res = await fetch('/api/cron/reminders');
            const data = await res.json();

            toast.dismiss(toastId);
            if (data.success) {
                toast.success(`Ejecutado correctamente. Enviados: ${data.processed}`);
            } else {
                toast.error(`Error: ${data.error}`);
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Error al conectar con el endpoint");
            console.error(err);
        }
    };

    const canEdit = myRole === "OWNER" || myRole === "ADMIN";
    const isLoading = isLoadingCompany || isLoadingReminders;

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Configuración de Agendamiento" />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Configuración de Agendamiento" />
            <div className="flex flex-1 flex-col p-4 space-y-6 w-full">

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                        <CardDescription>
                            Reglas básicas para la recepción de citas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-base">Confirmación de Agendamiento</Label>
                                <p className="text-sm text-muted-foreground">
                                    Las citas nuevas quedarán pendientes hasta que el cliente las confirme vía email o tú las apruebes.
                                </p>
                            </div>
                            <Switch
                                checked={company?.requiresBookingConfirmation || false}
                                onCheckedChange={(checked) => updateCompany.mutate({ requiresBookingConfirmation: checked })}
                                disabled={!canEdit || updateCompany.isPending}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Reminders Settings */}
                {/* Reminders Settings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Recordatorios Automáticos</h2>
                            <p className="text-sm text-muted-foreground">
                                Configura alertas para reducir el ausentismo (No-Show)
                            </p>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-2" onClick={handleTestRun}>
                                    <Play className="size-4" />
                                    <span className="hidden sm:inline">Probar Envío</span>
                                </Button>
                                <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2">
                                            <Plus className="size-4" />
                                            <span>Nuevo recordatorio</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Nuevo recordatorio</DialogTitle>
                                            <DialogDescription>
                                                Configura alertas automáticas para tus citas
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Canal</Label>
                                                <Select
                                                    value={reminderForm.channel}
                                                    onValueChange={(val: any) => setReminderForm({ ...reminderForm, channel: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="EMAIL">Email</SelectItem>
                                                        <SelectItem value="WHATSAPP" disabled>WhatsApp (Próximamente)</SelectItem>
                                                        <SelectItem value="SMS" disabled>SMS (Próximamente)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Tiempo</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={reminderForm.timeValue}
                                                        onChange={(e) => setReminderForm({ ...reminderForm, timeValue: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Unidad</Label>
                                                    <Select
                                                        value={reminderForm.timeUnit}
                                                        onValueChange={(val: any) => setReminderForm({ ...reminderForm, timeUnit: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="MINUTES">Minutos antes</SelectItem>
                                                            <SelectItem value="HOURS">Horas antes</SelectItem>
                                                            <SelectItem value="DAYS">Días antes</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateReminder} disabled={createReminder.isPending}>
                                                {createReminder.isPending ? "Guardando..." : "Guardar"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {reminders?.map((reminder) => (
                            <Card key={reminder.id} className="relative border-muted shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Clock className="size-4 text-primary" />
                                            {reminder.timeValue} {reminder.timeUnit === 'MINUTES' ? 'Minutos' : reminder.timeUnit === 'HOURS' ? 'Horas' : 'Días'} antes
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-1">
                                                <Switch
                                                    checked={reminder.isActive}
                                                    onCheckedChange={(checked) => toggleReminder.mutate({ id: reminder.id, isActive: checked })}
                                                    disabled={toggleReminder.isPending}
                                                    className="scale-75 origin-right"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 text-destructive hover:text-destructive ml-1"
                                                    onClick={() => deleteReminder.mutate({ id: reminder.id })}
                                                    disabled={deleteReminder.isPending}
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded w-fit">
                                        <Bell className="size-3" />
                                        <span>Vía {reminder.channel}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {reminders?.length === 0 && (
                            <Card className="col-span-full border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Bell className="size-8 mb-2 opacity-50" />
                                    <p>No hay recordatorios configurados</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
