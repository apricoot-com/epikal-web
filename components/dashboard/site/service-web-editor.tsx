"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";

const faqSchema = z.object({
    question: z.string().min(1, "La pregunta es requerida"),
    answer: z.string().min(1, "La respuesta es requerida"),
});

const serviceWebSchema = z.object({
    slug: z.string().min(1),
    displayTitle: z.string().optional(),
    heroImage: z.string().url().optional().or(z.literal("")),
    content: z.string().optional(),
    faqs: z.array(faqSchema).optional(),
});

type ServiceWebForm = z.infer<typeof serviceWebSchema>;

interface ServiceWebEditorProps {
    serviceId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ServiceWebEditor({ serviceId, open, onOpenChange }: ServiceWebEditorProps) {
    const { data: service, isLoading } = trpc.service.get.useQuery(
        { id: serviceId! },
        { enabled: !!serviceId }
    );

    const utils = trpc.useUtils();

    const mutation = trpc.service.updateWebDetails.useMutation({
        onSuccess: () => {
            toast.success("Servicio actualizado");
            utils.service.get.invalidate({ id: serviceId! });
            onOpenChange(false);
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
        name: "faqs" as never, // Type assertion issue with deeply nested arrays in RHF sometimes
    });

    // Reset/Load form when service loads
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
        if (!serviceId) return;
        mutation.mutate({
            serviceId,
            ...data,
            faqs: data.faqs as { question: string; answer: string }[]
        });
    };

    if (!serviceId) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[800px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Editar en Web: {service?.name}</SheetTitle>
                    <SheetDescription>
                        Configura cómo se ve este servicio en tu sitio público.
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="py-8">Cargando...</div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        <Tabs defaultValue="content">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="content">Contenido</TabsTrigger>
                                <TabsTrigger value="media">Multimedia</TabsTrigger>
                                <TabsTrigger value="faqs">Preguntas (FAQ)</TabsTrigger>
                            </TabsList>

                            {/* CONTENT TAB */}
                            <TabsContent value="content" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Slug (URL)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm">/services/</span>
                                        <Input {...form.register("slug")} placeholder="limpieza-facial" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Título Visible</Label>
                                    <Input {...form.register("displayTitle")} placeholder="Título atractivo..." />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descripción Detallada (Markdown)</Label>
                                    <Textarea
                                        {...form.register("content")}
                                        className="min-h-[300px] font-mono text-sm"
                                        placeholder="# Título&#10;Descripción..."
                                    />
                                    <p className="text-xs text-muted-foreground">Soporta negritas (**texto**), listas (- item) y encabezados (# Título).</p>
                                </div>
                            </TabsContent>

                            {/* MEDIA TAB */}
                            <TabsContent value="media" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Imagen Principal (URL)</Label>
                                    <Input {...form.register("heroImage")} placeholder="https://..." />
                                </div>
                                {form.watch("heroImage") && (
                                    <div className="mt-4 rounded-lg overflow-hidden border">
                                        <img src={form.watch("heroImage") || ""} alt="Preview" className="w-full h-48 object-cover" />
                                    </div>
                                )}
                            </TabsContent>

                            {/* FAQS TAB */}
                            <TabsContent value="faqs" className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Preguntas Frecuentes</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", answer: "" } as any)}>
                                        <Plus className="w-4 h-4 mr-2" /> Agregar Pregunta
                                    </Button>
                                </div>
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-4">
                                        {(fields as any[]).map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Pregunta #{index + 1}</span>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    {...form.register(`faqs.${index}.question` as const)}
                                                    placeholder="¿Duele el tratamiento?"
                                                />
                                                <Textarea
                                                    {...form.register(`faqs.${index}.answer` as const)}
                                                    placeholder="No, es un procedimiento indoloro..."
                                                    rows={2}
                                                />
                                            </div>
                                        ))}
                                        {fields.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                No hay preguntas frecuentes añadidas.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
}
