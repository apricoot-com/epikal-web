"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, DollarSign, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type ServiceFormData = {
    name: string;
    description: string;
    duration: number;
    price: number;
    allowsDeposit: boolean;
    depositAmount: number;
    isPublic: boolean;
};

const emptyForm: ServiceFormData = {
    name: "",
    description: "",
    duration: 60,
    price: 0,
    allowsDeposit: false,
    depositAmount: 0,
    isPublic: true,
};

export default function ServicesPage() {
    const { data: services, isLoading, refetch } = trpc.service.list.useQuery({ includeInactive: true });
    const { data: myRole } = trpc.team.myRole.useQuery();
    const createService = trpc.service.create.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
        },
    });
    const updateService = trpc.service.update.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        },
    });
    const deleteService = trpc.service.delete.useMutation({
        onSuccess: () => refetch(),
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ServiceFormData>(emptyForm);

    const canEdit = myRole === "OWNER" || myRole === "ADMIN";

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const handleOpenEdit = (service: {
        id: string;
        name: string;
        description: string | null;
        duration: number;
        price: number;
        allowsDeposit: boolean;
        depositAmount: number | null;
        isPublic: boolean;
    }) => {
        setEditingId(service.id);
        setForm({
            name: service.name,
            description: service.description || "",
            duration: service.duration,
            price: service.price,
            allowsDeposit: service.allowsDeposit,
            depositAmount: service.depositAmount || 0,
            isPublic: service.isPublic,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateService.mutateAsync({
                id: editingId,
                ...form,
                depositAmount: form.allowsDeposit ? form.depositAmount : null,
            });
        } else {
            await createService.mutateAsync({
                ...form,
                depositAmount: form.allowsDeposit ? form.depositAmount : undefined,
            });
        }
    };

    const handleTogglePublic = async (id: string, isPublic: boolean) => {
        await updateService.mutateAsync({ id, isPublic: !isPublic });
    };

    const isPending = createService.isPending || updateService.isPending;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
        }).format(price);
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Servicios" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Servicios" />
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground">
                        {services?.filter((s) => s.status === "ACTIVE").length || 0} servicio
                        {services?.filter((s) => s.status === "ACTIVE").length !== 1 ? "s" : ""} activo
                        {services?.filter((s) => s.status === "ACTIVE").length !== 1 ? "s" : ""}
                    </p>
                    {canEdit && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
                                    <Plus className="size-4" />
                                    <span className="hidden sm:inline">Nuevo servicio</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingId ? "Editar servicio" : "Nuevo servicio"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {editingId
                                                ? "Modifica los datos del servicio"
                                                : "Define un nuevo servicio para tu catálogo"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre *</Label>
                                            <Input
                                                id="name"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="Consulta general"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Descripción</Label>
                                            <Input
                                                id="description"
                                                value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                placeholder="Descripción breve del servicio"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="duration">Duración (min) *</Label>
                                                <Input
                                                    id="duration"
                                                    type="number"
                                                    min={5}
                                                    max={480}
                                                    value={form.duration}
                                                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Precio *</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={form.price}
                                                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isPublic"
                                                checked={form.isPublic}
                                                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                                                className="size-4"
                                            />
                                            <Label htmlFor="isPublic" className="font-normal">
                                                Visible en página pública
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="allowsDeposit"
                                                checked={form.allowsDeposit}
                                                onChange={(e) => setForm({ ...form, allowsDeposit: e.target.checked })}
                                                className="size-4"
                                            />
                                            <Label htmlFor="allowsDeposit" className="font-normal">
                                                Permite anticipo
                                            </Label>
                                        </div>
                                        {form.allowsDeposit && (
                                            <div className="space-y-2 ml-6">
                                                <Label htmlFor="depositAmount">Monto de anticipo</Label>
                                                <Input
                                                    id="depositAmount"
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={form.depositAmount}
                                                    onChange={(e) => setForm({ ...form, depositAmount: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending
                                                ? "Guardando..."
                                                : editingId
                                                    ? "Guardar cambios"
                                                    : "Crear servicio"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {services?.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="size-12 text-muted-foreground mb-4" />
                        <CardTitle className="mb-2">Sin servicios</CardTitle>
                        <CardDescription className="text-center mb-4">
                            Crea tu primer servicio para empezar a recibir citas
                        </CardDescription>
                        {canEdit && (
                            <Button onClick={handleOpenCreate}>
                                <Plus className="size-4 mr-2" />
                                Nuevo servicio
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {services?.map((service) => (
                            <Card
                                key={service.id}
                                className={`group ${service.status === "INACTIVE" ? "opacity-50" : ""}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                                {service.status === "INACTIVE" && (
                                                    <Badge variant="secondary">Inactivo</Badge>
                                                )}
                                                {!service.isPublic && (
                                                    <Badge variant="outline" className="gap-1">
                                                        <EyeOff className="size-3" />
                                                        Oculto
                                                    </Badge>
                                                )}
                                            </div>
                                            {service.description && (
                                                <CardDescription className="mt-1">
                                                    {service.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleTogglePublic(service.id, service.isPublic)}
                                                    title={service.isPublic ? "Ocultar" : "Mostrar"}
                                                >
                                                    {service.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleOpenEdit(service)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Desactivar servicio?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                El servicio &quot;{service.name}&quot; será marcado como inactivo
                                                                y no aparecerá para nuevas citas.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteService.mutate({ id: service.id })}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Desactivar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="size-4" />
                                            <span>{formatDuration(service.duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="size-4" />
                                            <span>{formatPrice(service.price)}</span>
                                        </div>
                                        {service.allowsDeposit && service.depositAmount && (
                                            <Badge variant="outline">
                                                Anticipo: {formatPrice(service.depositAmount)}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
