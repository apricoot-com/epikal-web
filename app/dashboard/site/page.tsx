"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
    LayoutTemplate,
    Home,
    MessageSquare,
    Contact,
    Settings,
    ArrowRight,
    ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard/header";

export default function SiteEditorPage() {
    const router = useRouter();
    const { data: company, isLoading, refetch } = trpc.company.get.useQuery();

    const updateSettingsMutation = trpc.company.update.useMutation({
        onSuccess: () => {
            toast.success("Configuración guardada");
            refetch();
        }
    });

    if (isLoading) {
        return (
            <>
                <DashboardHeader title="Gestión del Sitio Web" />
                <div className="p-8">Cargando configuración...</div>
            </>
        );
    }

    if (!company) {
        return (
            <>
                <DashboardHeader title="Gestión del Sitio Web" />
                <div className="p-8">No se encontró la empresa.</div>
            </>
        );
    }

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

    const templates = [
        {
            id: "home",
            name: "Página de Inicio",
            description: "La portada de tu sitio web. Configura el hero y la bienvenida.",
            icon: Home,
            pageParam: "home"
        },
        {
            id: "service-template",
            name: "Plantilla de Servicios",
            description: "El diseño maestro para todas tus páginas de servicios individuales.",
            icon: LayoutTemplate,
            pageParam: "service-detail",
            badge: "Global"
        },
        {
            id: "about",
            name: "Sobre Nosotros",
            description: "Historia de la empresa y equipo.",
            icon: MessageSquare,
            pageParam: "about"
        },
        {
            id: "services-index",
            name: "Índice de Servicios",
            description: "Listado principal de todos los servicios ofrecidos.",
            icon: LayoutTemplate,
            pageParam: "services"
        },
        {
            id: "contact",
            name: "Contacto",
            description: "Información de contacto y formulario.",
            icon: Contact,
            pageParam: "contact"
        }
    ];

    return (
        <>
            <DashboardHeader
                title="Gestión del Sitio Web"
            >
                <Button variant="outline" size="sm" asChild>
                    <a
                        href={`http://${company.slug}.localhost:3000`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Ver sitio</span>
                    </a>
                </Button>
            </DashboardHeader>

            <div className="flex-1 space-y-8 p-4 md:p-8 w-full">


                <Tabs defaultValue="templates" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="templates">Plantillas</TabsTrigger>
                        <TabsTrigger value="configuration">Configuración</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates" className="space-y-6">
                        {/* Templates Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {templates.map((template) => (
                                <Card key={template.id} className="group hover:border-primary/50 transition-colors flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <template.icon className="h-5 w-5" />
                                            </div>
                                            {template.badge && (
                                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                                    {template.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {template.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button
                                            className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                            variant="secondary"
                                            onClick={() => router.push(`/dashboard/site/editor?page=${template.pageParam}`)}
                                        >
                                            Editar Plantilla
                                            <ArrowRight className="h-4 w-4 ml-2 opacity-50 group-hover:opacity-100" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="configuration">
                        {/* Global Settings */}
                        <div className="w-full">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Analítica</CardTitle>
                                    <CardDescription>
                                        Conecta Google Tag Manager y Facebook Pixel.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveGeneral} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="gtmId">Google Tag Manager ID</Label>
                                                <Input
                                                    id="gtmId"
                                                    name="gtmId"
                                                    defaultValue={siteSettings.analytics?.googleTagManagerId}
                                                    placeholder="GTM-XXXXXX"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pixelId">Facebook Pixel ID</Label>
                                                <Input
                                                    id="pixelId"
                                                    name="pixelId"
                                                    defaultValue={siteSettings.analytics?.facebookPixelId}
                                                    placeholder="1234567890"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                                {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
