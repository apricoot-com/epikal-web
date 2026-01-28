"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Check } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";
import { CreditCardForm } from "@/components/billing/credit-card-form";

const TIER_INFO: Record<SubscriptionTier, { price: string; features: string[] }> = {

    PROFESSIONAL: {
        price: "$29",
        features: [
            "1 ubicación",
            "Hasta 20 servicios",
            "1 profesional",
            "Agendamiento online",
        ],
    },
    TEAM: {
        price: "Desde $79",
        features: [
            "Multi-sede (1+)",
            "Servicios ilimitados",
            "Múltiples profesionales",
            "Dominio personalizado",
            "Gestión avanzada",
        ],
    },
    ENTERPRISE: {
        price: "Contacto",
        features: [
            "Sedes ilimitadas",
            "Profesionales ilimitados",
            "Marca blanca",
            "API Access",
            "Soporte prioritario 24/7",
        ],
    },
};

export default function BillingPage() {
    const { subscription, isLoading, refetch } = useSubscription();

    if (isLoading) {
        return <div className="p-8">Cargando...</div>;
    }

    if (!subscription) {
        return <div className="p-8">No se pudo cargar la información de suscripción.</div>;
    }

    const calculateUsagePercentage = (current: number, max: number) => {
        if (max === -1) return 0; // unlimited
        return (current / max) * 100;
    };

    console.log("DEBUG: Billing Page Subscription:", subscription);

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Suscripción y Facturación</h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu plan mensual. Todos los planes pagos incluyen 14 días de prueba gratis.
                </p>
            </div>

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <CardTitle>Plan Actual</CardTitle>
                    <CardDescription>Tu suscripción activa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">{subscription.planName || subscription.tier}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {subscription.planDescription}
                            </p>
                        </div>
                        <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                            {subscription.status}
                        </Badge>
                    </div>

                    {subscription.endsAt && (
                        <div className="text-sm text-muted-foreground">
                            {subscription.status === "TRIALING" ? (
                                <p>
                                    Tu prueba termina el <strong>{new Date(subscription.endsAt).toLocaleDateString("es-MX")}</strong>.
                                    <br />
                                    A partir de esa fecha se te cobrará <strong>{TIER_INFO[subscription.tier as SubscriptionTier]?.price || ""}</strong> mensuales.
                                </p>
                            ) : (
                                <p>
                                    Próximo pago: <strong>{new Date(subscription.endsAt).toLocaleDateString("es-MX")}</strong>
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Transaction History - Now on Left */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Historial de Pagos</CardTitle>
                        <CardDescription>Últimos movimientos registrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(subscription as any).transactions?.length > 0 ? (
                                (subscription as any).transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {new Date(tx.createdAt).toLocaleDateString("es-MX", {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                ID: {tx.gatewayId || tx.id}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: tx.currency }).format(parseFloat(tx.amount))}
                                            </p>
                                            <Badge
                                                variant={tx.status === 'SUCCESS' ? 'default' : 'destructive'}
                                                className="text-[10px] h-5 px-1.5"
                                            >
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay pagos registrados.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Payment & Usage */}
                <div className="h-full flex flex-col gap-8">
                    {/* Payment Integration */}
                    <CreditCardForm
                        companyId={subscription.companyId}
                        existingPaymentMethod={(subscription as any).paymentMethod}
                        onSuccess={() => refetch()}
                    />

                    {/* Usage Stats - Now on Right */}
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Uso Actual</CardTitle>
                            <CardDescription>Revisa tu consumo y límites</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(subscription.usage).map(([key, value]) => {
                                const limitKey = `max${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof subscription.limits;
                                const limit = subscription.limits[limitKey];
                                const percentage =
                                    typeof limit === "number" ? calculateUsagePercentage(value, limit) : 0;

                                return (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium capitalize">{getLabel(key)}</span>
                                            <span className="text-muted-foreground">
                                                {value} / {typeof limit === "number" && limit === -1 ? "∞" : limit}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Available Plans */}
            <div className="space-y-4 pt-4">
                <h2 className="text-2xl font-bold">Planes Disponibles</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(Object.keys(TIER_INFO) as SubscriptionTier[]).map((tier) => {
                        const info = TIER_INFO[tier];
                        const isCurrent = subscription.tier === tier;

                        return (
                            <Card
                                key={tier}
                                className={isCurrent ? "border-primary shadow-md" : ""}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{tier}</CardTitle>
                                        {isCurrent && (
                                            <Badge variant="default">Actual</Badge>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">{info.price}</span>
                                        {tier !== "ENTERPRISE" && (
                                            <span className="text-muted-foreground">/mes</span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {info.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? "outline" : "default"}
                                        disabled={isCurrent}
                                    >
                                        {isCurrent ? "Plan Actual" : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                {tier === "ENTERPRISE" ? "Contactar" : "Seleccionar"}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function getLabel(key: string): string {
    const labels: Record<string, string> = {
        locations: "Ubicaciones",
        services: "Servicios",
        teamMembers: "Miembros del Equipo",
        resources: "Recursos",
    };
    return labels[key] || key;
}
