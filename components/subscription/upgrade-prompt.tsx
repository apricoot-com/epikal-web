"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
    currentTier?: SubscriptionTier;
    requiredTier?: SubscriptionTier;
    currentCount?: number;
    limit?: number;
    reason?: string;
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
    FREE: "Gratis",
    BASIC: "Básico",
    PROFESSIONAL: "Profesional",
    ENTERPRISE: "Empresarial",
};

export function UpgradePrompt({
    isOpen,
    onClose,
    feature,
    currentTier,
    requiredTier,
    currentCount,
    limit,
    reason,
}: UpgradePromptProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push("/dashboard/settings/billing");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Función Premium
                    </DialogTitle>
                    <DialogDescription>
                        {reason || `Has alcanzado el límite de ${limit} ${feature}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {currentCount !== undefined && limit !== undefined && (
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Uso actual:</span>
                                <span className="font-semibold">
                                    {currentCount} / {limit}
                                </span>
                            </div>
                        </div>
                    )}

                    {requiredTier && (
                        <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>Actualiza a {TIER_NAMES[requiredTier]}</AlertTitle>
                            <AlertDescription>
                                Desbloquea límites más altos y funciones avanzadas para hacer crecer tu negocio.
                            </AlertDescription>
                        </Alert>
                    )}

                    {currentTier && (
                        <p className="text-sm text-muted-foreground">
                            Plan actual: <span className="font-medium">{TIER_NAMES[currentTier]}</span>
                        </p>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpgrade}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Ver Planes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
