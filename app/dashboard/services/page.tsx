"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";

export default function ServicesPage() {
    const router = useRouter();
    const { data: services, isLoading, refetch } = trpc.service.list.useQuery({ includeInactive: true });
    const { data: myRole } = trpc.team.myRole.useQuery();

    // Quick toggle mutation
    const updateService = trpc.service.update.useMutation({
        onSuccess: () => {
            refetch();
            toast.success("Service updated");
        },
    });

    const deleteService = trpc.service.delete.useMutation({
        onSuccess: () => {
            refetch();
            toast.success("Service deactivated");
        },
    });

    const canEdit = myRole === "OWNER" || myRole === "ADMIN";

    const handleCreate = () => {
        router.push("/dashboard/services/new");
    };

    const handleEdit = (id: string) => {
        router.push(`/dashboard/services/${id}`);
    };

    const handleTogglePublic = async (e: React.MouseEvent, id: string, isPublic: boolean) => {
        e.stopPropagation();
        await updateService.mutateAsync({ id, isPublic: !isPublic });
    };

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
                        <Button size="sm" className="gap-2" onClick={handleCreate}>
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">Nuevo servicio</span>
                        </Button>
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
                            <Button onClick={handleCreate}>
                                <Plus className="size-4 mr-2" />
                                Nuevo servicio
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {services?.map((service) => (
                            <Card
                                key={service.id}
                                className={`group cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${service.status === "INACTIVE" ? "opacity-50" : ""}`}
                                onClick={() => handleEdit(service.id)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="text-lg group-hover:text-primary transition-colors">{service.name}</CardTitle>
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
                                            <CardDescription className="mt-1 line-clamp-2">
                                                {service.description || "Sin descripción"}
                                            </CardDescription>
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-foreground"
                                                    onClick={(e) => handleTogglePublic(e, service.id, service.isPublic)}
                                                    title={service.isPublic ? "Ocultar" : "Mostrar"}
                                                >
                                                    {service.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-destructive"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Desactivar servicio?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                El servicio &quot;{service.name}&quot; será marcado como inactivo.
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
                                            <Badge variant="secondary" className="font-normal text-xs">
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
