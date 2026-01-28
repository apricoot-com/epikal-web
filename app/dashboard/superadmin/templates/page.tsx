"use client";

import { useState } from "react";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Upload, FileArchive, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function TemplatesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery();
    const deleteMutation = trpc.templates.delete.useMutation({
        onSuccess: () => {
            toast.success("Plantilla eliminada correctamente");
            refetch();
        },
        onError: (err) => {
            toast.error("Error al eliminar", { description: err.message });
        }
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Plantillas</h1>
                    <p className="text-muted-foreground mt-1">
                        Sube y administra las plantillas de sitio web disponibles.
                    </p>
                </div>
                <UploadTemplateDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={() => {
                        setIsDialogOpen(false);
                        refetch();
                    }}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : templates?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">No hay plantillas</h3>
                    <p className="text-muted-foreground text-sm mt-1">Sube la primera plantilla para comenzar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates?.map((template) => (
                        <Card key={template.id} className="flex flex-col">
                            <div className="aspect-video bg-muted relative overflow-hidden group">
                                {template.previewImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={`/uploads/${template.previewImage}`} // Assuming local/s3 public access mapped here or just logic 
                                        alt={template.name}
                                        className="object-cover w-full h-full text-xs text-muted-foreground"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                        <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                    <Badge variant="secondary" className="text-xs bg-white/90 text-black hover:bg-white">{template.isPublic ? 'Pública' : 'Privada'}</Badge>
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="leading-tight">{template.name}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                    {template.description || "Sin descripción"}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto pt-0 flex justify-end gap-2">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
                                            deleteMutation.mutate({ id: template.id });
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function UploadTemplateDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createMutation = trpc.templates.create.useMutation({
        onSuccess: () => {
            toast.success("Plantilla subida correctamente");
            onSuccess();
            // Reset form
            setName("");
            setDescription("");
            setZipFile(null);
            setImageFile(null);
        },
        onError: (err) => {
            toast.error("Error al subir", { description: err.message });
            setIsSubmitting(false);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!zipFile || !name) {
            toast.error("Faltan datos requeridos");
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert files to base64
            const zipBase64 = await fileToBase64(zipFile);
            const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined;

            createMutation.mutate({
                name,
                description,
                zipBase64,
                imageBase64: imageBase64 as string | undefined
            });
        } catch (err) {
            console.error(err);
            toast.error("Error procesando archivos");
            setIsSubmitting(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Plantilla
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Subir Nueva Plantilla</DialogTitle>
                    <DialogDescription>
                        Sube un archivo .zip con el código fuente. Debe contener un `index.html` con `{"{{"}content{"}}"}`.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Minimal Dark v1" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Descripción</Label>
                        <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descripción del diseño..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Archivo .zip</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition cursor-pointer relative">
                                <Input
                                    type="file"
                                    accept=".zip"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setZipFile(e.target.files?.[0] || null)}
                                    required
                                />
                                <div className="flex flex-col items-center gap-1">
                                    <FileArchive className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground truncate w-full px-2">
                                        {zipFile ? zipFile.name : "Seleccionar ZIP"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Preview (Opcional)</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition cursor-pointer relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center gap-1">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground truncate w-full px-2">
                                        {imageFile ? imageFile.name : "Seleccionar Imagen"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Subir Plantilla
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
