
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
    email: z.email("Email inválido"),
});

interface CreditCardFormProps {
    companyId: string;
    existingPaymentMethod?: {
        brand: string;
        last4: string;
        expiryMonth: number;
        expiryYear: number;
    } | null;
    onSuccess?: () => void;
}

export function CreditCardForm({ companyId, existingPaymentMethod, onSuccess }: CreditCardFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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

    // ... onSubmit logic stays same ...

    // If we have a card and are not editing, show the summary view
    if (existingPaymentMethod && !isEditing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Método de Pago
                    </CardTitle>
                    <CardDescription>
                        Tarjeta registrada actualmente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-background p-2 rounded border">
                                <CreditCard className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">
                                    {existingPaymentMethod.brand} •••• {existingPaymentMethod.last4}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Expira: {existingPaymentMethod.expiryMonth}/{existingPaymentMethod.expiryYear}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Cambiar Tarjeta
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default return (form)
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        // ... (keep existing onSubmit content)
        console.log("DEBUG: Submitting Card Form. CompanyId:", companyId);
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
            setIsEditing(false); // Go back to view mode if successful
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
                    {isEditing ? "Ingresa los datos de la nueva tarjeta." : "Agrega tu tarjeta para iniciar tu suscripción. Los datos viajan encriptados."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Fields ... */}

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

                        <div className="flex gap-4">
                            {existingPaymentMethod && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </Button>
                            )}
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    "Guardar Tarjeta"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
