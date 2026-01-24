"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, GripVertical, Trash2, DollarSign, Clock, Plus, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { MarkdownEditor } from "@/components/editor/markdown-editor";

// Simple slugify helper
function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

export default function ServiceEditorPage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId as string;
    const isNew = serviceId === "new";

    const { data: service, isLoading: isLoadingService } = trpc.service.get.useQuery(
        { id: serviceId },
        { enabled: !isNew }
    );

    // Core Service Data State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Web / SEO State
    const [heroImage, setHeroImage] = useState("");
    const [content, setContent] = useState("");

    // FAQs State
    const [faqs, setFaqs] = useState<{ question: string, answer: string }[]>([]);

    // Pricing State
    const [price, setPrice] = useState<number>(0);
    const [duration, setDuration] = useState<number>(60);
    const [allowsDeposit, setAllowsDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState<number>(0);

    // Settings
    const [isPublic, setIsPublic] = useState(true);

    // Initial Load
    useEffect(() => {
        if (service) {
            // Basic
            setName(service.name);
            setDescription(service.description || "");
            setPrice(service.price);
            setDuration(service.duration);
            setAllowsDeposit(service.allowsDeposit);
            setDepositAmount(service.depositAmount || 0);
            setIsPublic(service.isPublic);

            // Web
            if (service.webPage) {
                setHeroImage(service.webPage.heroImage || "");
                setContent(service.webPage.content || "");
                if (service.webPage.faqs && Array.isArray(service.webPage.faqs)) {
                    setFaqs(service.webPage.faqs as { question: string, answer: string }[]);
                }
            }
        }
    }, [service]);

    const utils = trpc.useUtils();

    const createService = trpc.service.create.useMutation({
        onSuccess: (data) => {
            // Always update web details to ensure slug, image, content, and FAQs are saved
            updateWebDetails.mutate({
                serviceId: data.id,
                slug: slugify(data.name), // Auto-generate slug
                displayTitle: data.name,
                heroImage,
                content,
                seo: {
                    title: data.name,
                    description: description
                },
                faqs: faqs
            });
        },
        onError: (err) => toast.error("Error al crear servicio: " + err.message)
    });

    const updateService = trpc.service.update.useMutation({
        onSuccess: () => {
            // After basic update, update web details
            updateWebDetails.mutate({
                serviceId,
                slug: slugify(name), // Auto-update slug
                displayTitle: name,
                heroImage,
                content,
                seo: {
                    title: name,
                    description: description
                },
                faqs: faqs
            });
        },
        onError: (err) => toast.error("Error al guardar servicios: " + err.message)
    });

    const updateWebDetails = trpc.service.updateWebDetails.useMutation({
        onSuccess: () => {
            toast.success("Servicio guardado exitosamente");
            utils.service.get.invalidate({ id: serviceId });
            utils.service.list.invalidate();
            if (isNew) {
                router.push(`/dashboard/services/${serviceId}`);
            }
        },
        onError: (err) => toast.error("Error al guardar detalles web: " + err.message)
    });

    const handleSave = () => {
        if (isNew) {
            createService.mutate({
                name,
                description,
                price,
                duration,
                allowsDeposit,
                depositAmount: allowsDeposit ? depositAmount : undefined,
                isPublic,
                resourceIds: []
            });
        } else {
            updateService.mutate({
                id: serviceId,
                name,
                description,
                price,
                duration,
                allowsDeposit,
                depositAmount: allowsDeposit ? depositAmount : null,
                isPublic
            });
        }
    };

    const addFaq = () => {
        setFaqs([...faqs, { question: "", answer: "" }]);
    };

    const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...faqs];
        newFaqs[index][field] = value;
        setFaqs(newFaqs);
    };

    const removeFaq = (index: number) => {
        const newFaqs = faqs.filter((_, i) => i !== index);
        setFaqs(newFaqs);
    };

    if (isLoadingService && !isNew) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const isSaving = createService.isPending || updateService.isPending || updateWebDetails.isPending;

    return (
        <>
            <DashboardHeader
                title={isNew ? "Nuevo Servicio" : name || "Editar Servicio"}
                backHref="/dashboard/services"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{isPublic ? "Público" : "Oculto"}</span>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                </div>
            </DashboardHeader>

            <div className="flex flex-1 flex-col p-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="flex h-auto w-fit gap-1 bg-muted p-1">
                        <TabsTrigger value="general">Detalles</TabsTrigger>
                        <TabsTrigger value="faqs">Preguntas Frecuentes</TabsTrigger>
                        <TabsTrigger value="pricing">Precios</TabsTrigger>
                        <TabsTrigger value="resources" disabled={isNew}>Recursos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Información Básica</CardTitle>
                                        <CardDescription>Detalles internos y contenido web para este servicio.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/20">
                                        <Switch id="public-switch" checked={isPublic} onCheckedChange={setIsPublic} />
                                        <Label htmlFor="public-switch" className="text-sm font-medium cursor-pointer">Visible Públicamente</Label>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Nombre del Servicio</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej. Masaje de Tejido Profundo"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label component-id="image-url-label">URL de Imagen</Label>
                                    <Input
                                        value={heroImage}
                                        onChange={(e) => setHeroImage(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>

                                {heroImage && (
                                    <div className="aspect-video w-full md:w-1/2 rounded-lg bg-muted border overflow-hidden relative">
                                        <img src={heroImage} alt="Vista previa" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Descripción Corta</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Una breve descripción para listados..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción Larga (Página Web)</Label>
                                    <MarkdownEditor
                                        value={content}
                                        onChange={setContent}
                                        placeholder="Descripción detallada, beneficios, proceso..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {!isNew && (
                            <Card className="border-red-200 bg-red-50/10">
                                <CardHeader>
                                    <CardTitle className="text-red-900">Zona de Peligro</CardTitle>
                                    <CardDescription className="text-red-700/80">
                                        Estas acciones no se pueden deshacer.
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                        // TODO: Add delete functionality
                                        onClick={() => toast.info("Funcionalidad de eliminar próximamente")}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar Servicio Permanentemente
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="faqs" className="mt-4">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Preguntas Frecuentes</CardTitle>
                                        <CardDescription>Resuelva dudas comunes sobre este servicio.</CardDescription>
                                    </div>
                                    <Button onClick={addFaq} size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" /> Agregar
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {faqs.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay preguntas frecuentes añadidas aún.
                                        </div>
                                    ) : (
                                        faqs.map((faq, index) => (
                                            <div key={index} className="relative flex flex-col gap-4 p-4 border rounded-lg bg-muted/5 group">
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removeFaq(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Pregunta</Label>
                                                    <Input
                                                        value={faq.question}
                                                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                                        placeholder="Ej. ¿Qué incluye este servicio?"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Respuesta</Label>
                                                    <Textarea
                                                        value={faq.answer}
                                                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                                        rows={2}
                                                        placeholder="La respuesta detallada..."
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Precios y Duración</CardTitle>
                                <CardDescription>Establezca el costo y el tiempo requerido para este servicio.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Fields unstacked as requested */}
                                <div className="space-y-2">
                                    <Label>Precio ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min={0}
                                            className="pl-9"
                                            value={price}
                                            onChange={(e) => setPrice(parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Duración (Minutos)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min={5}
                                            step={5}
                                            className="pl-9"
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
                                    <div className="space-y-0.5">
                                        <Label>Requerir Depósito</Label>
                                        <p className="text-sm text-muted-foreground">Cobrar un monto parcial en línea para asegurar la reserva.</p>
                                    </div>
                                    <Switch checked={allowsDeposit} onCheckedChange={setAllowsDeposit} />
                                </div>

                                {allowsDeposit && (
                                    <div className="space-y-2 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-left-2">
                                        <Label>Monto del Depósito ($)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resources" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recursos y Personal</CardTitle>
                                <CardDescription>Gestione quién y qué se necesita para este servicio.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="bg-muted rounded-full p-3 mb-4">
                                        <GripVertical className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Gestión de Recursos Próximamente</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                        Podrá asignar miembros del personal y habitaciones específicas a este servicio aquí.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
