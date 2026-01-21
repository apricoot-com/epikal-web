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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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

    const [socialUrls, setSocialUrls] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        tiktok: "",
    });

    // Initialize form when data loads
    const initForm = () => {
        if (company) {
            setName(company.name);
            setLegalName(company.legalName || "");
            setPrimaryColor(company.branding?.primaryColor || "#3B82F6");
            setSecondaryColor(company.branding?.secondaryColor || "#10B981");

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

    // Handle general settings save
    const handleSaveGeneral = async () => {
        await updateCompany.mutateAsync({
            name,
            legalName: legalName || null,
        });
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
    };

    // Handle branding save
    const handleSaveBranding = async () => {
        await updateBranding.mutateAsync({
            primaryColor,
            secondaryColor,
        });
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
                <Tabs defaultValue="general" className="w-full" onValueChange={initForm}>
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="branding">Marca</TabsTrigger>
                        <TabsTrigger value="social">Redes Sociales</TabsTrigger>
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
                                        className="max-w-md"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="legalName">Razón social (opcional)</Label>
                                    <Input
                                        id="legalName"
                                        value={legalName || company?.legalName || ""}
                                        onChange={(e) => setLegalName(e.target.value)}
                                        disabled={!canEdit}
                                        className="max-w-md"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL pública</Label>
                                    <div className="flex items-center gap-2 max-w-md">
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
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md">
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

                    <TabsContent value="branding" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identidad de Marca</CardTitle>
                                <CardDescription>
                                    Define los colores y estilo visual de tu negocio
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
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
                                <div className="max-w-md mt-4">
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
                                        className="max-w-md"
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
                                        className="max-w-md"
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
                                        className="max-w-md"
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
                                        className="max-w-md"
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
                                        className="max-w-md"
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
                </Tabs>
            </div>
        </>
    );
}
