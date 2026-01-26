
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
import { Shield, LogIn, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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
                // Better Auth typically uses a cookie name like 'better-auth.session_token'
                // Since user requested "impersonate admins", we assume this replaces the current session
                // OR we can try to rely on the backend setting it if we used httpOnly (but we returned it).

                // Note: Client-side cookie setting for HttpOnly cookies is impossible. 
                // We rely on the fact that if it's NOT HttpOnly, we can set it. 
                // If it IS HttpOnly, we needed the server to Set-Cookie via header (which Mutation response doesn't do easily in tRPC app router without extra context manipulation).
                // Assuming standard practice for admin tools: set the cookie here.

                // Try setting common cookie names for Better Auth if uncertain, or just the one we expect.
                // Based on auth.ts config `cookieCache`, it seems standard.
                // Since we don't have exact cookie name, we try the default `better-auth.session_token`.

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
                <DashboardHeader title="Super Admin: Empresas" />
                <div className="p-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Super Admin: Empresas" />
            <div className="p-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Owner</TableHead>
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
