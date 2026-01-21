"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, ArrowLeft, Save } from "lucide-react";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/editor/markdown-editor";

const faqSchema = z.object({
    question: z.string().min(1, "La pregunta es requerida"),
    answer: z.string().min(1, "La respuesta es requerida"),
});

const serviceWebSchema = z.object({
    slug: z.string().min(1, "El slug es requerido"),
    displayTitle: z.string().optional(),
    heroImage: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    content: z.string().optional(),
    faqs: z.array(faqSchema).optional(),
});

type ServiceWebForm = z.infer<typeof serviceWebSchema>;

export default function ServiceEditorPage(props: { params: Promise<{ serviceId: string }> }) {
    const params = use(props.params);
    const serviceId = params.serviceId;
    const router = useRouter();

    const { data: service, isLoading } = trpc.service.get.useQuery(
        { id: serviceId },
        { enabled: !!serviceId }
    );

    const utils = trpc.useUtils();

    const mutation = trpc.service.updateWebDetails.useMutation({
        onSuccess: () => {
            toast.success("Servicio actualizado correctamente");
            utils.service.get.invalidate({ id: serviceId });
        },
        onError: (err) => {
            toast.error("Error al guardar: " + err.message);
        }
    });

    const form = useForm<ServiceWebForm>({
        resolver: zodResolver(serviceWebSchema),
        defaultValues: {
            slug: "",
            displayTitle: "",
            heroImage: "",
            content: "",
            faqs: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "faqs" as never,
    });

    useEffect(() => {
        if (service) {
            form.reset({
                slug: service.webPage?.slug || service.name.toLowerCase().replace(/ /g, "-"),
                displayTitle: service.webPage?.displayTitle || service.name,
                heroImage: service.webPage?.heroImage || "",
                content: service.webPage?.content || service.description || "",
                faqs: (service.webPage?.faqs as any) || []
            });
        }
    }, [service, form]);

    const onSubmit = (data: ServiceWebForm) => {
        mutation.mutate({
            serviceId,
            ...data,
            faqs: data.faqs as { question: string; answer: string }[]
        });
    };

    if (isLoading) {
        return <div className="p-8">Cargando información del servicio...</div>;
    }

    if (!service) {
        return <div className="p-8">No se encontró el servicio.</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Header with Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/dashboard/site")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Editar: {service.name}</h2>
                            <p className="text-muted-foreground">Personaliza la presentación web de este servicio.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/dashboard/site")}
                            disabled={mutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3">
                        <TabsTrigger value="content">Contenido Principal</TabsTrigger>
                        <TabsTrigger value="media">Multimedia & Hero</TabsTrigger>
                        <TabsTrigger value="faqs">Preguntas Frecuentes</TabsTrigger>
                    </TabsList>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                                <CardDescription>Define cómo se encuentra y lee tu servicio.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Slug (URL)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm font-mono bg-muted p-2 rounded-l-md border border-r-0">/services/</span>
                                        <Input {...form.register("slug")} className="rounded-l-none" placeholder="limpieza-facial" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">La dirección URL única para este servicio.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Título Visible</Label>
                                    <Input {...form.register("displayTitle")} placeholder="Ej. Limpieza Facial Profunda" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descripción Detallada (Editor Web)</Label>
                                    <div className="min-h-[400px]">
                                        <MarkdownEditor
                                            value={form.watch("content") || ""}
                                            onChange={(val) => form.setValue("content", val, { shouldDirty: true })}
                                            placeholder="Escribe aquí los detalles del servicio..."
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                        <span>Usa la barra de herramientas para dar formato.</span>
                                        <span>Editor rico habilitado.</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MEDIA TAB */}
                    <TabsContent value="media" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Multimedia</CardTitle>
                                <CardDescription>Imágenes de cabecera y presentación.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Imagen Principal (Hero URL)</Label>
                                    <Input {...form.register("heroImage")} placeholder="https://ejemplo.com/imagen.jpg" />
                                </div>

                                {form.watch("heroImage") && (
                                    <div className="mt-4 rounded-xl overflow-hidden border bg-muted/20 relative aspect-video w-full max-w-2xl mx-auto shadow-sm">
                                        <img
                                            src={form.watch("heroImage") || ""}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs text-center">
                                            Vista previa
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FAQS TAB */}
                    <TabsContent value="faqs" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Preguntas Frecuentes</CardTitle>
                                    <CardDescription>Resuelve dudas comunes de tus clientes.</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", answer: "" } as any)}>
                                    <Plus className="w-4 h-4 mr-2" /> Agregar Nueva
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {(fields as any[]).map((field, index) => (
                                        <div key={field.id} className="p-6 border rounded-xl space-y-4 bg-card/50 hover:bg-card transition-colors shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full">
                                                    Pregunta #{index + 1}
                                                </span>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pregunta</Label>
                                                <Input
                                                    {...form.register(`faqs.${index}.question` as const)}
                                                    placeholder="¿Cuánto dura la sesión?"
                                                    className="font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Respuesta</Label>
                                                <Textarea
                                                    {...form.register(`faqs.${index}.answer` as const)}
                                                    placeholder="La sesión dura aproximadamente 60 minutos..."
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {fields.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                            <p>No hay preguntas frecuentes añadidas aún.</p>
                                            <Button type="button" variant="link" onClick={() => append({ question: "", answer: "" } as any)}>
                                                Agregar la primera pregunta
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </div>
    );
}
