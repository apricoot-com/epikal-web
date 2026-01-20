"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/src/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Error al iniciar sesión");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("Error al iniciar sesión. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                            E
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="h-11"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={loading}
                        >
                            {loading ? "Iniciando..." : "Iniciar Sesión"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            ¿No tienes cuenta?{" "}
                            <Link
                                href="/signup"
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                Crear cuenta
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
