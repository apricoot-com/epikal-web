
import { z } from "zod";
import { router, superadminProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { getStorageProvider } from "../../providers/storage";
import { prisma } from "@/lib/prisma";
import AdmZip from "adm-zip";
import crypto from 'crypto';

export const templatesRouter = router({
    /**
     * List all templates (Superadmin)
     */
    list: superadminProcedure.query(async () => {
        return prisma.template.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }),

    /**
     * Delete a template
     */
    delete: superadminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            const template = await prisma.template.findUnique({
                where: { id: input.id }
            });

            if (!template) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }

            // Delete files from storage
            const storage = getStorageProvider();
            try {
                if (template.storagePath) await storage.delete(template.storagePath);
                if (template.previewImage) await storage.delete(template.previewImage);
            } catch (e) {
                console.error("Error deleting template files:", e);
                // Continue to delete DB record
            }

            await prisma.template.delete({ where: { id: input.id } });
            return { success: true };
        }),

    /**
     * Create/Upload a new template
     */
    create: superadminProcedure
        .input(z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            zipBase64: z.string(),
            imageBase64: z.string().optional()
        }))
        .mutation(async ({ input }) => {
            const storage = getStorageProvider();
            const id = crypto.randomUUID();

            // 1. Process ZIP
            const zipBuffer = Buffer.from(input.zipBase64.replace(/^data:.+;base64,/, ''), 'base64');

            // Validate ZIP content
            try {
                const zip = new AdmZip(zipBuffer);
                const zipEntries = zip.getEntries();

                const indexEntry = zipEntries.find(entry => entry.entryName === "index.html" || entry.entryName.endsWith("/index.html"));

                if (!indexEntry) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "El archivo ZIP debe contener un 'index.html'"
                    });
                }

                const indexContent = indexEntry.getData().toString('utf8');
                if (!indexContent.includes('{{content}}') && !indexContent.includes('{{ content }}')) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "El archivo 'index.html' debe contener el placeholder {{content}} para la inyección de contenido."
                    });
                }

            } catch (e: any) {
                if (e instanceof TRPCError) throw e;
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Archivo ZIP inválido o corrupto: " + e.message
                });
            }

            // Upload ZIP
            const zipPath = `templates/sources/${id}.zip`;
            await storage.upload(zipPath, zipBuffer, 'application/zip');

            // 2. Process Image (if provided)
            let imagePath = null;
            if (input.imageBase64) {
                const imgMatches = input.imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                if (imgMatches) {
                    const contentType = imgMatches[1];
                    const imgBuffer = Buffer.from(imgMatches[2], 'base64');
                    imagePath = `templates/previews/${id}.jpg`; // normalized extension for simplicity or detect from mime
                    await storage.upload(imagePath, imgBuffer, contentType);
                }
            }

            // 3. Save to DB
            const template = await prisma.template.create({
                data: {
                    name: input.name,
                    description: input.description,
                    storagePath: zipPath,
                    previewImage: imagePath,
                    isPublic: true
                }
            });

            return template;
        })
});
