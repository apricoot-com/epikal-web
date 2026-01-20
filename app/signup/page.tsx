"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/src/lib/auth-client";
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

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setLoading(true);

        try {
            const result = await signUp.email({
                name,
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Error al crear cuenta");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("Error al crear cuenta. Intenta de nuevo.");
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
                    <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
                    <CardDescription>
                        Completa tus datos para registrarte
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
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                className="h-11"
                            />
                        </div>
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
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
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
                            {loading ? "Creando cuenta..." : "Crear Cuenta"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                href="/login"
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                Iniciar sesión
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
