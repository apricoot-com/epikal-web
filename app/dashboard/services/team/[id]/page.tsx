"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ProfessionalEditPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const professionalId = params.id as string;

    const { data: professional, isLoading } = trpc.resource.get.useQuery({
        id: professionalId,
    });
    const { data: locations } = trpc.location.list.useQuery();
    const { data: services } = trpc.service.list.useQuery();

    const updateResource = trpc.resource.update.useMutation({
        onSuccess: () => {
            toast({
                title: "Cambios guardados",
                description: "El profesional ha sido actualizado correctamente.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const assignServices = trpc.resource.assignServices.useMutation({
        onSuccess: () => {
            toast({
                title: "Servicios actualizados",
                description: "Los servicios han sido asignados correctamente.",
            });
        },
    });

    const deleteResource = trpc.resource.delete.useMutation({
        onSuccess: () => {
            toast({
                title: "Profesional desactivado",
                description: "El profesional ha sido desactivado.",
            });
            router.push("/dashboard/services/team");
        },
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        locationId: "",
        status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    });

    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    useEffect(() => {
        if (professional) {
            setFormData({
                name: professional.name,
                description: professional.description || "",
                locationId: professional.locationId || "none",
                status: professional.status,
            });
            setSelectedServiceIds(
                professional.services.map((s: any) => s.service.id)
            );
        }
    }, [professional]);

    const handleSaveAll = async () => {
        try {
            // Save basic info and location
            await updateResource.mutateAsync({
                id: professionalId,
                name: formData.name,
                description: formData.description || null,
                locationId: formData.locationId === "none" ? null : formData.locationId || null,
                status: formData.status,
            });

            // Save services
            await assignServices.mutateAsync({
                resourceId: professionalId,
                serviceIds: selectedServiceIds,
            });

            toast({
                title: "Cambios guardados",
                description: "Todos los cambios han sido guardados correctamente.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Ocurrió un error al guardar",
                variant: "destructive",
            });
        }
    };

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
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
                    disabled={updateResource.isPending || assignServices.isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {updateResource.isPending || assignServices.isPending
                        ? "Guardando..."
                        : "Guardar cambios"}
                </Button>
            </DashboardHeader>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="space-y-4">
                    {/* Información Básica */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Básica</CardTitle>
                            <CardDescription>
                                Datos generales del profesional
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                    {/* Ubicación */}
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
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">Ubicación actual:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {professional.location.name}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Servicios Asignados */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Servicios Asignados</CardTitle>
                            <CardDescription>
                                Selecciona los servicios que puede prestar este profesional
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {services?.map((service: any) => (
                                    <label
                                        key={service.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
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
                                <p className="text-center text-muted-foreground py-8">
                                    No hay servicios disponibles. Crea servicios primero.
                                </p>
                            )}

                        </CardContent>
                    </Card>

                    {/* Zona de Peligro */}
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                            <CardDescription>
                                Acciones irreversibles sobre este profesional
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="gap-2">
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
                </div>
            </div>
        </>
    );
}
