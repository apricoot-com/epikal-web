"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    MapPin,
    Phone,
    Mail,
    Pencil,
    Trash2,
    Globe
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { Bell, Clock, Play } from "lucide-react";

type LocationFormData = {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
};

const emptyLocationForm: LocationFormData = {
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
};

export default function CompanySettingsPage() {
    const { data: company, isLoading, refetch } = trpc.company.get.useQuery();
    const { data: myRole } = trpc.team.myRole.useQuery();
    const updateCompany = trpc.company.update.useMutation({
        onSuccess: () => refetch(),
    });
    const updateBranding = trpc.company.updateBranding.useMutation({
        onSuccess: () => refetch(),
    });

    const [name, setName] = useState("");
    const [legalName, setLegalName] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#3B82F6");
    const [secondaryColor, setSecondaryColor] = useState("#10B981");
    const [logoUrl, setLogoUrl] = useState("");
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);

    const [socialUrls, setSocialUrls] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        tiktok: "",
    });

    // Locations State
    const { data: locations, refetch: refetchLocations } = trpc.location.list.useQuery();
    const createLocation = trpc.location.create.useMutation({
        onSuccess: () => {
            toast.success("Ubicación creada");
            refetchLocations();
            setLocationsDialogOpen(false);
            setLocationForm(emptyLocationForm);
        },
    });
    const updateLocation = trpc.location.update.useMutation({
        onSuccess: () => {
            toast.success("Ubicación actualizada");
            refetchLocations();
            setLocationsDialogOpen(false);
            setLocationForm(emptyLocationForm);
            setEditingLocationId(null);
        },
    });
    const deleteLocation = trpc.location.delete.useMutation({
        onSuccess: () => {
            toast.success("Ubicación eliminada");
            refetchLocations();
        },
    });

    const [locationsDialogOpen, setLocationsDialogOpen] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
    const [locationForm, setLocationForm] = useState<LocationFormData>(emptyLocationForm);

    // Reminders State
    const { data: reminders, refetch: refetchReminders } = trpc.reminder.list.useQuery();
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


    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "general";

    // Initialize form when data loads
    const initForm = () => {
        if (company) {
            setName(company.name);
            setLegalName(company.legalName || "");
            setPrimaryColor(company.branding?.primaryColor || "#3B82F6");
            setSecondaryColor(company.branding?.secondaryColor || "#10B981");
            setLogoUrl(company.branding?.logoUrl || "");
            setRequiresConfirmation(company.requiresBookingConfirmation || false);

            const savedSocial = (company.socialUrls as any) || {};
            setSocialUrls({
                facebook: savedSocial.facebook || "",
                instagram: savedSocial.instagram || "",
                twitter: savedSocial.twitter || "",
                linkedin: savedSocial.linkedin || "",
                tiktok: savedSocial.tiktok || "",
            });
        }
    };

    // Initialize form when company data is loaded
    useEffect(() => {
        if (company) {
            initForm();
        }
    }, [company]);

    // Handle general settings save
    const handleSaveGeneral = async () => {
        await updateCompany.mutateAsync({
            name,
            legalName: legalName || null,
            requiresBookingConfirmation: requiresConfirmation,
        });
        toast.success("Información general guardada");
    };

    // Handle social settings save
    const handleSaveSocial = async () => {
        await updateCompany.mutateAsync({
            socialUrls: {
                facebook: socialUrls.facebook || null,
                instagram: socialUrls.instagram || null,
                twitter: socialUrls.twitter || null,
                linkedin: socialUrls.linkedin || null,
                tiktok: socialUrls.tiktok || null,
            },
        });
        toast.success("Redes sociales actualizadas");
    };

    // Handle branding save
    const handleSaveBranding = async () => {
        await updateBranding.mutateAsync({
            primaryColor,
            secondaryColor,
            logoUrl: logoUrl || null,
        });
        toast.success("Identidad visual actualizada");
    };

    // Locations Handlers
    const handleOpenCreateLocation = () => {
        setEditingLocationId(null);
        setLocationForm(emptyLocationForm);
        setLocationsDialogOpen(true);
    };

    const handleOpenEditLocation = (loc: any) => {
        setEditingLocationId(loc.id);
        setLocationForm({
            name: loc.name,
            address: loc.address || "",
            city: loc.city || "",
            country: loc.country || "",
            phone: loc.phone || "",
            email: loc.email || "",
        });
        setLocationsDialogOpen(true);
    };

    const handleLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLocationId) {
            await updateLocation.mutateAsync({
                id: editingLocationId,
                ...locationForm,
            });
        } else {
            await createLocation.mutateAsync(locationForm);
        }
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

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Empresa" />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Empresa" />
            <div className="flex flex-1 flex-col p-4">
                <Tabs defaultValue={activeTab} className="w-full" onValueChange={(val) => {
                    initForm();
                    router.push(`/dashboard/company?tab=${val}`);
                }}>
                    <TabsList className="grid w-full grid-cols-4 max-w-lg">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
                        <TabsTrigger value="branding">Marca</TabsTrigger>
                        <TabsTrigger value="social">Redes</TabsTrigger>
                        <TabsTrigger value="reminders">Recordatorios</TabsTrigger>

                    </TabsList>

                    <TabsContent value="general" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>
                                    Configura los datos básicos de tu empresa
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre comercial</Label>
                                    <Input
                                        id="name"
                                        value={name || company?.name || ""}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="legalName">Razón social (opcional)</Label>
                                    <Input
                                        id="legalName"
                                        value={legalName || company?.legalName || ""}
                                        onChange={(e) => setLegalName(e.target.value)}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL pública</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            epikal.com/
                                        </span>
                                        <Input
                                            id="slug"
                                            value={company?.slug || ""}
                                            disabled
                                            className="flex-1"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        El slug no se puede cambiar
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Zona horaria</Label>
                                        <Input value={company?.timezone || ""} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Moneda</Label>
                                        <Input value={company?.currency || ""} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Idioma</Label>
                                        <Input value={company?.language || ""} disabled />
                                    </div>
                                </div>

                                <Separator className="my-6" />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Confirmación de Agendamiento</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Las citas nuevas quedarán pendientes hasta que el cliente las confirme vía email.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={requiresConfirmation}
                                            onCheckedChange={setRequiresConfirmation}
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>

                                {canEdit && (
                                    <Button
                                        onClick={handleSaveGeneral}
                                        disabled={updateCompany.isPending}
                                        className="mt-4"
                                    >
                                        {updateCompany.isPending ? "Guardando..." : "Guardar cambios"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="locations" className="mt-4">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-sm text-muted-foreground">
                                {locations?.length || 0} ubicación{locations?.length !== 1 ? "es" : ""}
                            </p>
                            {canEdit && (
                                <Dialog open={locationsDialogOpen} onOpenChange={setLocationsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2" onClick={handleOpenCreateLocation}>
                                            <Plus className="size-4" />
                                            <span>Nueva ubicación</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleLocationSubmit}>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {editingLocationId ? "Editar ubicación" : "Nueva ubicación"}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {editingLocationId
                                                        ? "Modifica los datos de esta sede"
                                                        : "Agrega una nueva sede o sucursal"}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="loc-name">Nombre *</Label>
                                                    <Input
                                                        id="loc-name"
                                                        value={locationForm.name}
                                                        onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                                                        placeholder="Sede Principal"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="loc-address">Dirección</Label>
                                                    <Input
                                                        id="loc-address"
                                                        value={locationForm.address}
                                                        onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                                                        placeholder="Calle, número, colonia"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="loc-city">Ciudad</Label>
                                                        <Input
                                                            id="loc-city"
                                                            value={locationForm.city}
                                                            onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                                                            placeholder="Ciudad de México"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="loc-country">País</Label>
                                                        <Input
                                                            id="loc-country"
                                                            value={locationForm.country}
                                                            onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                                                            placeholder="México"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="loc-phone">Teléfono</Label>
                                                        <Input
                                                            id="loc-phone"
                                                            value={locationForm.phone}
                                                            onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                                                            placeholder="+52 55 1234 5678"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="loc-email">Email</Label>
                                                        <Input
                                                            id="loc-email"
                                                            type="email"
                                                            value={locationForm.email}
                                                            onChange={(e) => setLocationForm({ ...locationForm, email: e.target.value })}
                                                            placeholder="sede@empresa.com"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={createLocation.isPending || updateLocation.isPending}>
                                                    {(createLocation.isPending || updateLocation.isPending)
                                                        ? "Guardando..."
                                                        : editingLocationId
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
                                    <Button onClick={handleOpenCreateLocation}>
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
                                                            onClick={() => handleOpenEditLocation(location)}
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
                    </TabsContent>

                    <TabsContent value="branding" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identidad de Marca</CardTitle>
                                <CardDescription>
                                    Define los colores y estilo visual de tu negocio
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label>Logotipo de la empresa</Label>
                                    <ImageUpload
                                        value={logoUrl}
                                        onChange={(url) => setLogoUrl(url)}
                                        onRemove={() => setLogoUrl("")}
                                        folder="branding"
                                        description="Se usará en emails, facturas y tu sitio web."
                                    />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">Color primario</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                id="primaryColor"
                                                value={primaryColor || company?.branding?.primaryColor || "#3B82F6"}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                disabled={!canEdit}
                                                className="w-12 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={primaryColor || company?.branding?.primaryColor || "#3B82F6"}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                disabled={!canEdit}
                                                className="flex-1 font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="secondaryColor">Color secundario</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                id="secondaryColor"
                                                value={secondaryColor || company?.branding?.secondaryColor || "#10B981"}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                disabled={!canEdit}
                                                className="w-12 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={secondaryColor || company?.branding?.secondaryColor || "#10B981"}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                disabled={!canEdit}
                                                className="flex-1 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Color preview */}
                                <div className="mt-4">
                                    <Label className="mb-2 block">Vista previa</Label>
                                    <div className="flex gap-2">
                                        <div
                                            className="h-16 flex-1 rounded-lg flex items-center justify-center text-white font-medium"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Primario
                                        </div>
                                        <div
                                            className="h-16 flex-1 rounded-lg flex items-center justify-center text-white font-medium"
                                            style={{ backgroundColor: secondaryColor }}
                                        >
                                            Secundario
                                        </div>
                                    </div>
                                </div>

                                {canEdit && (
                                    <Button
                                        onClick={handleSaveBranding}
                                        disabled={updateBranding.isPending}
                                        className="mt-4"
                                    >
                                        {updateBranding.isPending ? "Guardando..." : "Guardar colores"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Redes Sociales</CardTitle>
                                <CardDescription>
                                    Enlaza tus perfiles oficiales para que aparezcan en tu sitio web
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebook">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        placeholder="https://facebook.com/tupagina"
                                        value={socialUrls.facebook}
                                        onChange={(e) => setSocialUrls({ ...socialUrls, facebook: e.target.value })}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="https://instagram.com/tuusuario"
                                        value={socialUrls.instagram}
                                        onChange={(e) => setSocialUrls({ ...socialUrls, instagram: e.target.value })}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter">X / Twitter</Label>
                                    <Input
                                        id="twitter"
                                        placeholder="https://x.com/tuusuario"
                                        value={socialUrls.twitter}
                                        onChange={(e) => setSocialUrls({ ...socialUrls, twitter: e.target.value })}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        placeholder="https://linkedin.com/company/tuempresa"
                                        value={socialUrls.linkedin}
                                        onChange={(e) => setSocialUrls({ ...socialUrls, linkedin: e.target.value })}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tiktok">TikTok</Label>
                                    <Input
                                        id="tiktok"
                                        placeholder="https://tiktok.com/@tuusuario"
                                        value={socialUrls.tiktok}
                                        onChange={(e) => setSocialUrls({ ...socialUrls, tiktok: e.target.value })}
                                        disabled={!canEdit}
                                        className=""
                                    />
                                </div>

                                {canEdit && (
                                    <Button
                                        onClick={handleSaveSocial}
                                        disabled={updateCompany.isPending}
                                        className="mt-4"
                                    >
                                        {updateCompany.isPending ? "Guardando..." : "Guardar redes sociales"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>


                    <TabsContent value="reminders" className="mt-4">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-sm text-muted-foreground">
                                {reminders?.length || 0} recordatorio{reminders?.length !== 1 ? "s" : ""}
                            </p>
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
                                <Card key={reminder.id} className="relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Clock className="size-5 text-muted-foreground" />
                                                {reminder.timeValue} {reminder.timeUnit === 'MINUTES' ? 'Minutos' : reminder.timeUnit === 'HOURS' ? 'Horas' : 'Días'} antes
                                            </CardTitle>
                                            {canEdit && (
                                                <div className="flex gap-1">
                                                    <Switch
                                                        checked={reminder.isActive}
                                                        onCheckedChange={(checked) => toggleReminder.mutate({ id: reminder.id, isActive: checked })}
                                                        disabled={toggleReminder.isPending}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive ml-2"
                                                        onClick={() => deleteReminder.mutate({ id: reminder.id })}
                                                        disabled={deleteReminder.isPending}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                                            <Bell className="size-4" />
                                            <span>Envia {reminder.channel}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div >
        </>
    );
}
