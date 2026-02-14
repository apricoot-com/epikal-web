"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CreateCompanyDialog() {
    const [open, setOpen] = useState(false);
    const utils = trpc.useUtils();
    const createCompany = trpc.superadmin.createCompany.useMutation();

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        ownerName: "",
        ownerEmail: "",
        serviceName: "Consulta General",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === "name" && !prev.slug) {
                newData.slug = value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Creando empresa...");

        try {
            await createCompany.mutateAsync(formData);
            toast.dismiss(toastId);
            toast.success("Empresa creada exitosamente");
            setOpen(false);
            setFormData({
                name: "",
                slug: "",
                ownerName: "",
                ownerEmail: "",
                serviceName: "Consulta General",
            });
            utils.superadmin.listCompanies.invalidate();
            // Refresh to ensure all side-effects (like new service) are visible if we navigated there, 
            // but for list view invalidation is enough.
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error(error.message || "Error al crear empresa");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Crear Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Empresa</DialogTitle>
                    <DialogDescription>
                        Esto creará una nueva empresa con configuración "semilla" (branding, sitio web, profesional y servicio de ejemplo).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right">
                            Slug
                        </Label>
                        <Input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ownerName" className="text-right">
                            Dueño
                        </Label>
                        <Input
                            id="ownerName"
                            name="ownerName"
                            placeholder="Nombre del dueño"
                            value={formData.ownerName}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ownerEmail" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="ownerEmail"
                            name="ownerEmail"
                            type="email"
                            placeholder="dueño@empresa.com"
                            value={formData.ownerEmail}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="serviceName" className="text-right">
                            Servicio
                        </Label>
                        <Input
                            id="serviceName"
                            name="serviceName"
                            placeholder="Ej. Consulta General"
                            value={formData.serviceName}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createCompany.isPending}>
                            {createCompany.isPending ? "Creando..." : "Crear Empresa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function SuperAdminCompaniesPage() {
    const { data: companies, isLoading } = trpc.superadmin.listCompanies.useQuery({ limit: 50 });
    const impersonate = trpc.superadmin.impersonate.useMutation();
    const router = useRouter();

    const handleImpersonate = async (companyId: string) => {
        if (!confirm("¿Estás seguro de que quieres acceder como el dueño de esta empresa?")) return;

        const toastId = toast.loading("Iniciando sesión como usuario...");
        try {
            const result = await impersonate.mutateAsync({ companyId });

            if (result.success && result.sessionToken) {
                // Set the session cookie manually
                document.cookie = `better-auth.session_token=${result.sessionToken}; path=/; max-age=${60 * 60 * 24}`; // 1 day

                toast.dismiss(toastId);
                toast.success("Sesión iniciada. Redirigiendo...");

                // Force reload to pick up new session
                window.location.href = "/dashboard";
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Error al iniciar sesión");
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Super Admin: Empresas">
                    <Button disabled>Crear Empresa</Button>
                </DashboardHeader>
                <div className="p-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Super Admin: Empresas">
                <CreateCompanyDialog />
            </DashboardHeader>
            <div className="p-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Suscripción</TableHead>
                                <TableHead>Estadísticas</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies?.items.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{company.name}</span>
                                            <span className="text-xs text-muted-foreground">{company.legalName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{company.slug}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{company.members[0]?.user.name || "Sin asignar"}</span>
                                            <span className="text-xs text-muted-foreground">{company.members[0]?.user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            {(() => {
                                                const subData = (company.subscriptionData as any) || {};
                                                return (
                                                    <>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {subData.tier || 'FREE'}
                                                        </Badge>
                                                        <Badge
                                                            variant={subData.status === 'ACTIVE' ? 'default' : 'destructive'}
                                                            className="text-[10px]"
                                                        >
                                                            {subData.status || 'ACTIVE'}
                                                        </Badge>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span title="Usuarios">{company._count.members} usr</span>
                                            <span>•</span>
                                            <span title="Sedes">{company._count.locations} loc</span>
                                            <span>•</span>
                                            <span title="Reservas">{company._count.bookings} res</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(company.createdAt), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="gap-2"
                                            onClick={() => handleImpersonate(company.id)}
                                        >
                                            <LogIn className="size-4" />
                                            Acceder
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
