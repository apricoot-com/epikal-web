"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon, Pencil } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    folder: "profiles" | "services" | "branding" | "templates";
    label?: string;
    description?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    folder,
    label,
    description
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadMutation = trpc.storage.uploadImage.useMutation({
        onSuccess: (data) => {
            onChange(data.url);
            setIsUploading(false);
            toast.success("Imagen subida correctamente");
        },
        onError: (error) => {
            setIsUploading(false);
            toast.error(error.message || "Error al subir la imagen");
        }
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen es demasiado grande. Máximo 5MB.");
            return;
        }

        // Convert to base64
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            uploadMutation.mutate({
                base64,
                filename: file.name,
                folder
            });
        };
        reader.readAsDataURL(file);
    };

    const onUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4 w-full">
            {label && <label className="text-sm font-medium">{label}</label>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}

            <div className="flex items-center gap-4">
                <div
                    className="relative size-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30 group"
                >
                    {value ? (
                        <>
                            <Image
                                src={value}
                                alt="Uploaded image"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                unoptimized={value.startsWith("/")}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-white hover:bg-white/20"
                                    onClick={onUploadClick}
                                    disabled={isUploading}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                {onRemove && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-white hover:bg-red-500/50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove();
                                        }}
                                        disabled={isUploading}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:text-foreground transition-colors p-4 text-center"
                            onClick={onUploadClick}
                        >
                            {isUploading ? (
                                <Loader2 className="size-8 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="size-8 mb-2" />
                                    <span className="text-xs">Subir imagen</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {!value && !isUploading && (
                    <div className="flex-1 text-sm text-muted-foreground">
                        Sube una imagen JPG, PNG o WebP.
                        <br />
                        Máximo 5MB per archivo.
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
