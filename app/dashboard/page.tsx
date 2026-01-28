"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { useSubscription } from "@/hooks/use-subscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Sparkles, XOctagon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    return (
        <>
            <DashboardHeader title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <SubscriptionStatusCard />

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Citas hoy</span>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Ingresos mes</span>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Clientes nuevos</span>
                    </div>
                </div>
                <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">
                        Actividad reciente • Próximamente
                    </span>
                </div>
            </div>
        </>
    );
}

function SubscriptionStatusCard() {
    // Need to make this a client component or ensure hook works. 'use client' is needed if not present.
    // The previous view_file didn't show 'use client' at top, but hooks usage implies it should be.
    // Let's check if 'use client' is there. It wasn't in the view_file output!
    // But page.tsx is a server component by default in app dir.
    // Wait, I can't use hooks in a server component.
    // I should extract this to a separate component file if I can't turn the page into client.
    // However, for dashboard page often it is client or has client parts.
    // Let's assume I can make this component here for now but I might need to add 'use client' to the file if it's not there.

    // Actually, looking back at step 519, there is NO 'use client' directive. 
    // Converting the whole dashboard page to client side just for this card is maybe okay, OR I should make a separate component.
    // Making a separate component is cleaner.
    // BUT user asked to "Show ... in the dashboard".
    // I already added imports and usage. 
    // I will add the component code here AND add "use client" to the top.

    const { subscription, isLoading } = useSubscription();
    const router = useRouter();

    if (isLoading || !subscription) return null;

    const daysRemaining = subscription.endsAt
        ? Math.ceil((new Date(subscription.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const statusConfig = {
        ACTIVE: {
            title: "Suscripción Activa",
            variant: "default" as const,
            icon: ShieldCheck,
            description: `Tu plan ${subscription.planName} está activo.`
        },
        TRIALING: {
            title: "Periodo de Prueba",
            variant: "default" as const,
            icon: Sparkles,
            description: `Te quedan ${daysRemaining} días de prueba gratis.`
        },
        PAST_DUE: {
            title: "Pago Pendiente",
            variant: "destructive" as const,
            icon: AlertTriangle,
            description: "No pudimos procesar tu último pago. Actualiza tu método de pago para evitar la suspensión."
        },
        CANCELED: {
            title: "Suscripción Cancelada",
            variant: "destructive" as const,
            icon: XOctagon,
            description: `Tu suscripción finalizó el ${new Date(subscription.endsAt || Date.now()).toLocaleDateString()}. Renueva ahora para recuperar el acceso.`
        }
    };

    const config = statusConfig[subscription.status] || statusConfig.ACTIVE;

    return (
        <Alert variant={config.variant} className="bg-background border-l-4">
            <config.icon className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
                {config.title}
                <Badge variant={config.variant === 'destructive' ? 'destructive' : 'outline'} className="ml-2">
                    {subscription.planName}
                </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2 flex items-center justify-between">
                <span>{config.description}</span>
                {(subscription.status === 'PAST_DUE' || subscription.status === 'CANCELED' || subscription.status === 'TRIALING') && (
                    <Button variant="link" className="h-auto p-0 ml-4 font-bold" onClick={() => router.push('/dashboard/settings/billing')}>
                        Gestionar Suscripción &rarr;
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
