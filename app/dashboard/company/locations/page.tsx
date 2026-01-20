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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Phone, Mail, Pencil, Trash2 } from "lucide-react";

type LocationFormData = {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
};

const emptyForm: LocationFormData = {
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
};

export default function LocationsPage() {
    const { data: locations, isLoading, refetch } = trpc.location.list.useQuery();
    const { data: myRole } = trpc.team.myRole.useQuery();
    const createLocation = trpc.location.create.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
        },
    });
    const updateLocation = trpc.location.update.useMutation({
        onSuccess: () => {
            refetch();
            setDialogOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        },
    });
    const deleteLocation = trpc.location.delete.useMutation({
        onSuccess: () => refetch(),
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<LocationFormData>(emptyForm);

    const canEdit = myRole === "OWNER" || myRole === "ADMIN";

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const handleOpenEdit = (location: {
        id: string;
        name: string;
        address: string | null;
        city: string | null;
        country: string | null;
        phone: string | null;
        email: string | null;
    }) => {
        setEditingId(location.id);
        setForm({
            name: location.name,
            address: location.address || "",
            city: location.city || "",
            country: location.country || "",
            phone: location.phone || "",
            email: location.email || "",
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateLocation.mutateAsync({
                id: editingId,
                ...form,
            });
        } else {
            await createLocation.mutateAsync(form);
        }
    };

    const isPending = createLocation.isPending || updateLocation.isPending;

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Ubicaciones" />
                <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Ubicaciones" />
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground">
                        {locations?.length || 0} ubicación{locations?.length !== 1 ? "es" : ""}
                    </p>
                    {canEdit && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
                                    <Plus className="size-4" />
                                    <span className="hidden sm:inline">Nueva ubicación</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingId ? "Editar ubicación" : "Nueva ubicación"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {editingId
                                                ? "Modifica los datos de esta sede"
                                                : "Agrega una nueva sede o sucursal"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre *</Label>
                                            <Input
                                                id="name"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="Sede Principal"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Dirección</Label>
                                            <Input
                                                id="address"
                                                value={form.address}
                                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                                placeholder="Calle, número, colonia"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">Ciudad</Label>
                                                <Input
                                                    id="city"
                                                    value={form.city}
                                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                                    placeholder="Ciudad de México"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country">País</Label>
                                                <Input
                                                    id="country"
                                                    value={form.country}
                                                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                                                    placeholder="México"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Teléfono</Label>
                                                <Input
                                                    id="phone"
                                                    value={form.phone}
                                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                    placeholder="+52 55 1234 5678"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="sede@empresa.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending
                                                ? "Guardando..."
                                                : editingId
                                                    ? "Guardar cambios"
                                                    : "Crear ubicación"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {locations?.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <MapPin className="size-12 text-muted-foreground mb-4" />
                        <CardTitle className="mb-2">Sin ubicaciones</CardTitle>
                        <CardDescription className="text-center mb-4">
                            Agrega tu primera sede o sucursal
                        </CardDescription>
                        {canEdit && (
                            <Button onClick={handleOpenCreate}>
                                <Plus className="size-4 mr-2" />
                                Nueva ubicación
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {locations?.map((location) => (
                            <Card key={location.id} className="group relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{location.name}</CardTitle>
                                        {canEdit && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleOpenEdit(location)}
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
                                                            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción eliminará permanentemente la ubicación
                                                                &quot;{location.name}&quot;.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteLocation.mutate({ id: location.id })}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    {location.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="size-4 mt-0.5 shrink-0" />
                                            <span>
                                                {location.address}
                                                {location.city && `, ${location.city}`}
                                                {location.country && `, ${location.country}`}
                                            </span>
                                        </div>
                                    )}
                                    {location.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="size-4 shrink-0" />
                                            <span>{location.phone}</span>
                                        </div>
                                    )}
                                    {location.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-4 shrink-0" />
                                            <span>{location.email}</span>
                                        </div>
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
