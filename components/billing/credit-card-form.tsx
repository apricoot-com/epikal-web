
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
    number: z.string().min(13, "Número invalido").max(19, "Número invalido"),
    holderName: z.string().min(2, "Nombre requerido"),
    expiryMonth: z.string().min(1, "Mes requerido"),
    expiryYear: z.string().min(4, "Año requerido"),
    cvv: z.string().min(3, "CVV requerido").max(4),
    email: z.string().email("Email inválido"),
});

interface CreditCardFormProps {
    companyId: string;
    onSuccess?: () => void;
}

export function CreditCardForm({ companyId, onSuccess }: CreditCardFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            number: "",
            holderName: "",
            expiryMonth: "",
            expiryYear: new Date().getFullYear().toString(),
            cvv: "",
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/subscriptions/register-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    cardData: {
                        number: values.number,
                        holderName: values.holderName,
                        expiryMonth: parseInt(values.expiryMonth),
                        expiryYear: parseInt(values.expiryYear),
                        cvv: values.cvv,
                        email: values.email,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al registrar la tarjeta");
            }

            toast.success("Tarjeta registrada exitosamente", {
                description: "Tu periodo de prueba de 14 días ha comenzado (si aplica).",
            });

            form.reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error("Error", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Método de Pago
                </CardTitle>
                <CardDescription>
                    Agrega tu tarjeta para iniciar tu suscripción. Los datos viajan encriptados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="holderName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Titular</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Como aparece en la tarjeta" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Tarjeta</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="0000 0000 0000 0000" {...field} />
                                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="expiryMonth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mes</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Mes" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const m = (i + 1).toString().padStart(2, '0');
                                                    return (
                                                        <SelectItem key={m} value={m}>
                                                            {m}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expiryYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Año</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Año" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {years.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cvv"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CVV</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123" maxLength={4} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email de Facturación</FormLabel>
                                    <FormControl>
                                        <Input placeholder="billing@empresa.com" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enviaremos los recibos a este correo.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                "Guardar Tarjeta y Activar"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
