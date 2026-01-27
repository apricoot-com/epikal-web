
"use client";

import { useState } from "react";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Trash2, Pencil, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";

export function TestimonialsManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [image, setImage] = useState("");

    const utils = trpc.useUtils();
    const { data: testimonials, isLoading } = trpc.testimonial.getAll.useQuery();

    const createMutation = trpc.testimonial.create.useMutation({
        onSuccess: () => {
            toast.success("Testimonio creado");
            setIsOpen(false);
            resetForm();
            utils.testimonial.getAll.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    const updateMutation = trpc.testimonial.update.useMutation({
        onSuccess: () => {
            toast.success("Testimonio actualizado");
            setIsOpen(false);
            resetForm();
            utils.testimonial.getAll.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.testimonial.delete.useMutation({
        onSuccess: () => {
            toast.success("Testimonio eliminado");
            utils.testimonial.getAll.invalidate();
        },
    });

    const resetForm = () => {
        setName("");
        setTitle("");
        setText("");
        setImage("");
        setEditingId(null);
    };

    const handleEdit = (t: any) => {
        setEditingId(t.id);
        setName(t.name);
        setTitle(t.title || "");
        setText(t.text);
        setImage(t.image || "");
        setIsOpen(true);
    };

    const handleSubmit = () => {
        if (!name || !text) {
            toast.error("Nombre y testimonio son requeridos");
            return;
        }

        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                name,
                title,
                text,
                image,
            });
        } else {
            createMutation.mutate({
                name,
                title,
                text,
                image,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Testimonios</h3>
                    <p className="text-sm text-muted-foreground">
                        Gestiona lo que dicen tus clientes sobre tu negocio.
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Testimonio
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Testimonio" : "Nuevo Testimonio"}</DialogTitle>
                            <DialogDescription>
                                Agrega comentarios reales de tus clientes para generar confianza.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. María Pérez"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título / Cargo (Opcional)</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej. Cliente VIP, Doctora, etc."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Foto del Cliente</Label>
                                <div className="w-full">
                                    <ImageUpload
                                        value={image}
                                        onChange={setImage}
                                        folder="testimonials"
                                        label=""
                                        description="Sube una foto del cliente (opcional)"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="text">Testimonio *</Label>
                                <Textarea
                                    id="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Escribe el testimonio aquí..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials?.map((t) => (
                        <Card key={t.id} className="relative group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {t.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-muted" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {t.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-base">{t.name}</CardTitle>
                                            {t.title && <CardDescription className="text-xs">{t.title}</CardDescription>}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground pb-6">
                                <Quote className="w-4 h-4 text-primary/20 mb-2 rotate-180 inline-block mr-1" />
                                {t.text}
                            </CardContent>
                            <CardFooter className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de eliminar este testimonio?")) {
                                            deleteMutation.mutate({ id: t.id });
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {testimonials?.length === 0 && (
                        <div className="col-span-full text-center py-12 border border-dashed rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">No hay testimonios aún.</p>
                            <Button variant="link" onClick={() => setIsOpen(true)}>Crear el primero</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
