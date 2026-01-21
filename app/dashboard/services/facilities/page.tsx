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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Plus, Building, Pencil, Trash2, MapPin } from "lucide-react";

type ResourceFormData = {
    name: string;
    description: string;
    locationId: string;
};

const emptyForm: ResourceFormData = {
    name: "",
    description: "",
    locationId: "",
};

// Types for tRPC data
interface ServiceData {
    id: string;
    name: string;
}

interface LocationData {
    id: string;
    name: string;
}

interface ResourceData {
    id: string;
    name: string;
    type: "PROFESSIONAL" | "PHYSICAL";
    description: string | null;
    locationId: string | null;
    status: "ACTIVE" | "INACTIVE";
    location: LocationData | null;
    services: { service: ServiceData }[];
}

export default function FacilitiesPage() {
    const { data: resources, isLoading, refetch } = trpc.resource.list.useQuery({
        includeInactive: true,
        type: "PHYSICAL"
    });
    const { data: locations } = trpc.location.list.useQuery();
    const { data: services } = trpc.service.list.useQuery();
    const { data: myRole } = trpc.team.myRole.useQuery();

    const createResource = trpc.resource.create.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
        },
    });
    const updateResource = trpc.resource.update.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        },
    });
    const deleteResource = trpc.resource.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const assignServices = trpc.resource.assignServices.useMutation({
        onSuccess: () => refetch(),
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ResourceFormData>(emptyForm);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigningResourceId, setAssigningResourceId] = useState<string | null>(null);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    const canEdit = myRole === "OWNER" || myRole === "ADMIN";

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const handleOpenEdit = (resource: {
        id: string;
        name: string;
        description: string | null;
        locationId: string | null;
    }) => {
        setEditingId(resource.id);
        setForm({
            name: resource.name,
            description: resource.description || "",
            locationId: resource.locationId || "",
        });
        setDialogOpen(true);
    };

    const handleOpenAssign = (resource: {
        id: string;
        services: Array<{ service: { id: string } }>;
    }) => {
        setAssigningResourceId(resource.id);
        setSelectedServiceIds(resource.services.map((s) => s.service.id));
        setAssignDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateResource.mutateAsync({
                id: editingId,
                name: form.name,
                description: form.description || null,
                locationId: form.locationId || null,
            });
        } else {
            await createResource.mutateAsync({
                ...form,
                type: "PHYSICAL",
                locationId: form.locationId || undefined,
            });
        }
    };

    const handleSaveAssignments = async () => {
        if (assigningResourceId) {
            await assignServices.mutateAsync({
                resourceId: assigningResourceId,
                serviceIds: selectedServiceIds,
            });
            setAssignDialogOpen(false);
        }
    };

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const isPending = createResource.isPending || updateResource.isPending;

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Instalaciones" />
                <div className="p-4 space-y-4">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Instalaciones" />
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground">
                        {resources?.filter((r: ResourceData) => r.status === "ACTIVE").length || 0} recurso
                        {resources?.filter((r: ResourceData) => r.status === "ACTIVE").length !== 1 ? "s" : ""}
                    </p>
                    {canEdit && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
                                    <Plus className="size-4" />
                                    <span className="hidden sm:inline">Nueva instalación</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingId ? "Editar instalación" : "Nueva instalación"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {editingId
                                                ? "Modifica los datos de la instalación"
                                                : "Registra una cabina, sala o equipo"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre *</Label>
                                            <Input
                                                id="name"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="Sala 1, Cabina A..."
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Descripción</Label>
                                            <Input
                                                id="description"
                                                value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                placeholder="Características, equipos incluidos..."
                                            />
                                        </div>
                                        {locations && locations.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Ubicación</Label>
                                                <Select
                                                    value={form.locationId || "unassigned"}
                                                    onValueChange={(v) => setForm({ ...form, locationId: v === "unassigned" ? "" : v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona ubicación" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Sin ubicación fija</SelectItem>
                                                        {locations.map((loc: LocationData) => (
                                                            <SelectItem key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending
                                                ? "Guardando..."
                                                : editingId
                                                    ? "Guardar cambios"
                                                    : "Crear instalación"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Assign Services Dialog */}
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Asignar servicios</DialogTitle>
                            <DialogDescription>
                                Selecciona los servicios que se pueden realizar en esta instalación
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
                            {services?.map((service: ServiceData) => (
                                <label
                                    key={service.id}
                                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedServiceIds.includes(service.id)}
                                        onChange={() => toggleService(service.id)}
                                        className="size-4"
                                    />
                                    <span>{service.name}</span>
                                </label>
                            ))}
                            {(!services || services.length === 0) && (
                                <p className="text-muted-foreground text-sm">
                                    No hay servicios disponibles. Crea servicios primero.
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSaveAssignments}
                                disabled={assignServices.isPending}
                            >
                                {assignServices.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {resources?.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <Building className="size-12 text-muted-foreground mb-4" />
                        <CardTitle className="mb-2">Sin instalaciones</CardTitle>
                        <CardDescription className="text-center mb-4">
                            Agrega tus salas, cabinas y equipos
                        </CardDescription>
                        {canEdit && (
                            <Button onClick={handleOpenCreate}>
                                <Plus className="size-4 mr-2" />
                                Nueva instalación
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {resources?.map((resource: ResourceData) => (
                            <Card
                                key={resource.id}
                                className={`group ${resource.status === "INACTIVE" ? "opacity-50" : ""}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building className="size-5 text-primary" />
                                            <CardTitle className="text-lg">{resource.name}</CardTitle>
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleOpenEdit(resource)}
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
                                                            <AlertDialogTitle>¿Desactivar instalación?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                &quot;{resource.name}&quot; será marcada como inactiva.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteResource.mutate({ id: resource.id })}
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
                                    {resource.description && (
                                        <CardDescription>{resource.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {resource.location && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="size-4" />
                                            <span>{resource.location.name}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                        {resource.services.length === 0 ? (
                                            <span className="text-sm text-muted-foreground">Sin servicios asignados</span>
                                        ) : (
                                            resource.services.slice(0, 3).map((sr: { service: ServiceData }) => (
                                                <Badge key={sr.service.id} variant="secondary" className="text-xs">
                                                    {sr.service.name}
                                                </Badge>
                                            ))
                                        )}
                                        {resource.services.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{resource.services.length - 3} más
                                            </Badge>
                                        )}
                                    </div>
                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => handleOpenAssign(resource)}
                                        >
                                            Asignar servicios
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
