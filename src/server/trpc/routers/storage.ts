import { z } from "zod";
import { router, companyProcedure } from "../init";
import { getStorageProvider } from "../../providers/storage";
import { TRPCError } from "@trpc/server";
import crypto from 'crypto';

/**
 * Storage router
 * Handles file uploads and management
 */
export const storageRouter = router({
    /**
     * Upload an image as base64
     */
    uploadImage: companyProcedure
        .input(
            z.object({
                base64: z.string(), // data:image/jpeg;base64,...
                filename: z.string(),
                folder: z.enum(["profiles", "services", "branding", "templates"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const storage = getStorageProvider();

            // Parse base64
            const matches = input.base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Formato de imagen inválido",
                });
            }

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
            if (!allowedTypes.includes(contentType)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Tipo de archivo no permitido: ${contentType}. Use JPG, PNG, GIF, WebP o SVG.`,
                });
            }

            // Generate a unique filename to avoid collisions
            const hash = crypto.randomBytes(8).toString('hex');
            const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${input.folder}/${ctx.company.id}/${hash}-${sanitizedFilename}`;

            try {
                const url = await storage.upload(filePath, buffer, contentType);
                return { url, filePath };
            } catch (error) {
                console.error("Storage upload error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Error al subir la imagen",
                });
            }
        }),

    /**
     * Delete a file
     */
    deleteFile: companyProcedure
        .input(z.object({ filePath: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const storage = getStorageProvider();

            // Security check: ensure the file belongs to the company folder
            // Path should be like: folder/companyId/filename
            const parts = input.filePath.split('/');
            if (parts[1] !== ctx.company.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No tienes permiso para eliminar este archivo",
                });
            }

            try {
                await storage.delete(input.filePath);
                return { success: true };
            } catch (error) {
                console.error("Storage delete error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Error al eliminar el archivo",
                });
            }
        }),
});
