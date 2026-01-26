"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Sparkles } from "lucide-react";

export default function AIDashboardPage() {
    return (
        <>
            <DashboardHeader title="Agente IA" />
            <div className="flex flex-1 items-center justify-center p-4">
                <Card className="max-w-md w-full border-dashed">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Agente IA</CardTitle>
                        <CardDescription>
                            Inteligencia Artificial para tu negocio
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-lg font-medium text-foreground">
                                Muy pronto por ahora
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Estamos trabajando en una asistente inteligente que podrá gestionar tus citas y responder dudas de tus clientes automáticamente.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>Próximamente disponible para todos los planes</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
