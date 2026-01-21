"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ServiceWebEditor } from "@/components/dashboard/site/service-web-editor";

export default function SiteEditorPage() {
    const { data: company, isLoading, refetch } = trpc.company.get.useQuery();
    const { data: services } = trpc.service.list.useQuery();

    // Mutations (placeholders for now, will connect to routers)
    const updateSettingsMutation = trpc.company.update.useMutation({
        onSuccess: () => {
            toast.success("Configuración guardada");
            refetch();
        }
    });

    const [activeTab, setActiveTab] = useState("general");

    // Editor State
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const handleEditService = (id: string) => {
        setEditingServiceId(id);
        setIsEditorOpen(true);
    };

    if (isLoading) return <div>Cargando editor...</div>;
    if (!company) return <div>No se encontró la empresa.</div>;

    // Helper to parse siteSettings safely
    const siteSettings = (company.siteSettings as any) || {};

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const analytics = {
            googleTagManagerId: formData.get("gtmId"),
            facebookPixelId: formData.get("pixelId"),
        };

        const newSettings = {
            ...siteSettings,
            analytics,
        };

        updateSettingsMutation.mutate({
            siteSettings: newSettings,
        });
    };

    const handleSaveHome = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const home = {
            heroTitle: formData.get("heroTitle"),
            heroDescription: formData.get("heroDescription"),
            heroImage: formData.get("heroImage"),
        };

        const newSettings = {
            ...siteSettings,
            home,
        };

        updateSettingsMutation.mutate({
            siteSettings: newSettings,
        });
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Editor del Sitio</h2>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="home">Inicio (Home)</TabsTrigger>
                    <TabsTrigger value="services">Servicios</TabsTrigger>
                    <TabsTrigger value="contact">Contacto</TabsTrigger>
                    {/* <TabsTrigger value="privacy">Legal</TabsTrigger> */}
                </TabsList>

                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analítica y configuración global</CardTitle>
                            <CardDescription>Conecta herramientas externas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Template Info Section */}
                            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                                <Label className="text-base">Plantilla Activa</Label>
                                {company.siteTemplate ? (
                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <p className="font-semibold">{company.siteTemplate.name}</p>
                                            <p className="text-sm text-muted-foreground">{company.siteTemplate.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a
                                                    href={`http://${company.slug}.localhost:3000`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Ver sitio público
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground mt-1">No hay plantilla seleccionada.</p>
                                )}
                            </div>

                            <Separator />

                            <form onSubmit={handleSaveGeneral} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gtmId">Google Tag Manager ID (GTM-XXXX)</Label>
                                    <Input
                                        id="gtmId"
                                        name="gtmId"
                                        defaultValue={siteSettings.analytics?.googleTagManagerId}
                                        placeholder="GTM-..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pixelId">Facebook Pixel ID</Label>
                                    <Input
                                        id="pixelId"
                                        name="pixelId"
                                        defaultValue={siteSettings.analytics?.facebookPixelId}
                                        placeholder="123456789..."
                                    />
                                </div>
                                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                    Guardar Cambios
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HOME TAB */}
                <TabsContent value="home" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Página de Inicio</CardTitle>
                            <CardDescription>Personaliza el hero y la bienvenida.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveHome} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="heroTitle">Título Principal</Label>
                                    <Input
                                        id="heroTitle"
                                        name="heroTitle"
                                        defaultValue={siteSettings.home?.heroTitle || company.name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="heroDescription">Descripción Corta</Label>
                                    <Textarea
                                        id="heroDescription"
                                        name="heroDescription"
                                        defaultValue={siteSettings.home?.heroDescription}
                                        placeholder="Breve descripción de tu clínica..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="heroImage">Imagen de Fondo (URL)</Label>
                                    <Input
                                        id="heroImage"
                                        name="heroImage"
                                        defaultValue={siteSettings.home?.heroImage}
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px</p>
                                </div>
                                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                    Guardar Cambios
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SERVICES TAB */}
                <TabsContent value="services" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenido de Servicios</CardTitle>
                            <CardDescription>Edita la descripción detallada y preguntas frecuentes de cada servicio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder for service list */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {services?.map((service: any) => (
                                    <Card key={service.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 border-l-4 border-l-primary transition-colors"
                                        onClick={() => handleEditService(service.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg">{service.name}</CardTitle>
                                            <CardDescription>
                                                {service.isPublic ? "Visible en web" : "Oculto"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-xs text-muted-foreground pb-4">
                                            Click para editar contenido web y FAQs.
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONTACT TAB */}
                <TabsContent value="contact" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Datos mostrados en el pie de página y página de contacto.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-zinc-500">
                                Próximamente: Configuración de mapa y horarios visibles.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ServiceWebEditor
                serviceId={editingServiceId}
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
            />
        </div>
    );
}
