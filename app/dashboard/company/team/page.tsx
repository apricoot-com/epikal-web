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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Trash2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    STAFF: "Empleado",
    VIEWER: "Solo lectura",
};

const ROLE_COLORS: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-800",
    ADMIN: "bg-blue-100 text-blue-800",
    STAFF: "bg-green-100 text-green-800",
    VIEWER: "bg-gray-100 text-gray-800",
};

export default function TeamPage() {
    const { data: members, isLoading, refetch } = trpc.team.list.useQuery();
    const { data: myRole } = trpc.team.myRole.useQuery();
    const updateRole = trpc.team.updateRole.useMutation({
        onSuccess: () => refetch(),
    });
    const removeMember = trpc.team.remove.useMutation({
        onSuccess: () => refetch(),
    });
    const inviteMember = trpc.team.invite.useMutation({
        onSuccess: () => {
            refetch();
            setInviteOpen(false);
            setInviteEmail("");
            setInviteName("");
            setInviteRole("STAFF");
        },
    });

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF" | "VIEWER">("STAFF");

    const isOwner = myRole === "OWNER";
    const canInvite = isOwner || myRole === "ADMIN";

    const getInitials = (name?: string | null) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        await inviteMember.mutateAsync({
            email: inviteEmail,
            name: inviteName,
            role: inviteRole,
        });
    };

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Equipo" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Equipo" />
            <div className="flex flex-1 flex-col p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Miembros del equipo</CardTitle>
                            <CardDescription>
                                {members?.length || 0} miembro{members?.length !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                        {canInvite && (
                            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <UserPlus className="size-4" />
                                        <span className="hidden sm:inline">Invitar</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleInvite}>
                                        <DialogHeader>
                                            <DialogTitle>Invitar miembro</DialogTitle>
                                            <DialogDescription>
                                                Envía una invitación por email para unirse al equipo
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="inviteName">Nombre</Label>
                                                <Input
                                                    id="inviteName"
                                                    value={inviteName}
                                                    onChange={(e) => setInviteName(e.target.value)}
                                                    placeholder="Nombre completo"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="inviteEmail">Email</Label>
                                                <Input
                                                    id="inviteEmail"
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="correo@ejemplo.com"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="inviteRole">Rol</Label>
                                                <Select
                                                    value={inviteRole}
                                                    onValueChange={(v) => setInviteRole(v as typeof inviteRole)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                                        <SelectItem value="STAFF">Empleado</SelectItem>
                                                        <SelectItem value="VIEWER">Solo lectura</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={inviteMember.isPending}
                                            >
                                                {inviteMember.isPending ? "Enviando..." : "Enviar invitación"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {members?.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <Avatar className="size-10">
                                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium truncate">
                                                {member.user.name}
                                            </span>
                                            {member.status === "INVITED" && (
                                                <Badge variant="outline" className="text-xs">
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {member.user.email}
                                        </p>
                                    </div>

                                    {/* Role selector/badge */}
                                    <div className="flex items-center gap-2">
                                        {isOwner && member.role !== "OWNER" ? (
                                            <Select
                                                value={member.role}
                                                onValueChange={(role) =>
                                                    updateRole.mutate({
                                                        userId: member.user.id,
                                                        role: role as "ADMIN" | "STAFF" | "VIEWER",
                                                    })
                                                }
                                                disabled={updateRole.isPending}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                                    <SelectItem value="STAFF">Empleado</SelectItem>
                                                    <SelectItem value="VIEWER">Solo lectura</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge className={ROLE_COLORS[member.role]}>
                                                {ROLE_LABELS[member.role]}
                                            </Badge>
                                        )}

                                        {/* Remove button */}
                                        {isOwner && member.role !== "OWNER" && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {member.user.name} ya no tendrá acceso a esta empresa.
                                                            Esta acción se puede revertir enviando una nueva invitación.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => removeMember.mutate({ userId: member.user.id })}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
