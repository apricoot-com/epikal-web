"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Tag, Facebook } from "lucide-react";

export default function IntegrationsPage() {
    const utils = trpc.useUtils();
    const { data: company } = trpc.company.get.useQuery();

    const [gtmId, setGtmId] = useState('');
    const [fbPixelId, setFbPixelId] = useState('');
    const [fbToken, setFbToken] = useState('');

    // Initialize form values when company data loads
    useEffect(() => {
        if (company) {
            setGtmId(company.gtmContainerId || '');
            setFbPixelId(company.fbPixelId || '');
        }
    }, [company]);

    const updateGTM = trpc.analytics.updateGTM.useMutation({
        onSuccess: () => {
            toast.success("Google Tag Manager actualizado");
            utils.company.get.invalidate();
        },
        onError: (error) => {
            toast.error("Error al actualizar GTM: " + error.message);
        }
    });

    const updateFB = trpc.analytics.updateFacebookPixel.useMutation({
        onSuccess: () => {
            toast.success("Facebook Pixel actualizado");
            utils.company.get.invalidate();
            setFbToken(''); // Clear token after saving
        },
        onError: (error) => {
            toast.error("Error al actualizar Facebook Pixel: " + error.message);
        }
    });

    const handleSaveGTM = () => {
        // Validate GTM ID format
        if (gtmId && !/^GTM-[A-Z0-9]+$/.test(gtmId)) {
            toast.error("Formato de GTM ID inválido. Debe ser GTM-XXXXXX");
            return;
        }
        updateGTM.mutate({ gtmContainerId: gtmId || null });
    };

    const handleSaveFB = () => {
        updateFB.mutate({
            fbPixelId: fbPixelId || null,
            fbAccessToken: fbToken || null
        });
    };

    return (
        <>
            <DashboardHeader title="Integraciones" />
            <div className="flex flex-1 flex-col p-4">
                <div className="space-y-6">
                    {/* Basic Analytics */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">Analíticas Básicas</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Siempre activas. Rastrea vistas de página y visitas a servicios.
                                </p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    ✓ Activo
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Google Tag Manager */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">Google Tag Manager</h3>
                                <p className="text-sm text-muted-foreground">
                                    Para tracking avanzado con GA4, eventos personalizados y más
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="gtm-id">Container ID</Label>
                                <Input
                                    id="gtm-id"
                                    placeholder="GTM-XXXXXX"
                                    value={gtmId}
                                    onChange={(e) => setGtmId(e.target.value.toUpperCase())}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Encuentra tu ID en Google Tag Manager
                                </p>
                            </div>

                            <Button
                                onClick={handleSaveGTM}
                                disabled={updateGTM.isPending}
                            >
                                {updateGTM.isPending ? 'Guardando...' : 'Guardar GTM'}
                            </Button>
                        </div>
                    </Card>

                    {/* Facebook Conversions API */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                <Facebook className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">Facebook Conversions API</h3>
                                <p className="text-sm text-muted-foreground">
                                    Rastrea conversiones y leads de forma server-side
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="fb-pixel">Pixel ID</Label>
                                <Input
                                    id="fb-pixel"
                                    placeholder="123456789012345"
                                    value={fbPixelId}
                                    onChange={(e) => setFbPixelId(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="fb-token">Access Token</Label>
                                <Input
                                    id="fb-token"
                                    type="password"
                                    placeholder="EAAxxxxxxxxxx"
                                    value={fbToken}
                                    onChange={(e) => setFbToken(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Genera un token en Facebook Business Manager
                                </p>
                            </div>

                            <Button
                                onClick={handleSaveFB}
                                disabled={updateFB.isPending}
                            >
                                {updateFB.isPending ? 'Guardando...' : 'Guardar Facebook Pixel'}
                            </Button>
                        </div>
                    </Card>

                    {/* Help Section */}
                    <Card className="p-6 bg-slate-50 dark:bg-slate-900/20">
                        <h3 className="text-lg font-semibold mb-3">Ayuda y Documentación</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                <strong>Google Tag Manager:</strong> Permite integrar Google Analytics 4, Facebook Pixel client-side, y otros servicios de tracking sin modificar código.
                            </p>
                            <p>
                                <strong>Facebook Conversions API:</strong> Envía eventos de conversión directamente desde el servidor, mejorando la precisión del tracking y evitando bloqueadores de anuncios.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
