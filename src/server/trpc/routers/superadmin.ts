
import { z } from "zod";
import { router, superadminProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { DayOfWeek, Prisma } from "@prisma/client";

export const superadminRouter = router({
    listCompanies: superadminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                cursor: z.string().nullish(), // For cursor-based pagination
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { prisma } = ctx;
            const limit = input.limit;
            const { cursor, search } = input;

            const items = await prisma.company.findMany({
                take: limit + 1, // get an extra item at the end which we'll use as next cursor
                cursor: cursor ? { id: cursor } : undefined,
                where: search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                        { legalName: { contains: search, mode: 'insensitive' } },
                    ]
                } : undefined,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    _count: {
                        select: {
                            members: true,
                            locations: true,
                            bookings: true
                        }
                    },
                    members: {
                        where: {
                            role: 'OWNER'
                        },
                        take: 1,
                        select: {
                            user: {
                                select: {
                                    email: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem!.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    impersonate: superadminProcedure
        .input(
            z.object({
                companyId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { prisma } = ctx;

            // 1. Find the owner of the company
            const membership = await prisma.userCompany.findFirst({
                where: {
                    companyId: input.companyId,
                    role: 'OWNER',
                    status: 'ACTIVE'
                },
                include: {
                    user: true
                }
            });

            if (!membership || !membership.user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Company owner not found'
                });
            }

            const targetUser = membership.user;

            // 2. Generate a new session token
            // Better-auth usually expects a string. We'll generate a random hex string.
            const sessionToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 1); // 1 day expiry

            // 3. Create session in DB
            await prisma.session.create({
                data: {
                    userId: targetUser.id,
                    token: sessionToken,
                    expiresAt: expiresAt,
                    userAgent: "SuperAdmin Impersonation",
                    ipAddress: ctx.headers?.get('x-forwarded-for') || "127.0.0.1"
                }
            });

            // 4. Return the token so client can set the cookie
            // The cookie name should match what Better Auth expects. 
            // Usually "better-auth.session_token" or similar, but we'll return the token
            // and let the client handle the cookie setting via a route handler or client-side JS if possible.
            // Client-side JS cannot set httpOnly cookies effectively if strictly enforced, 
            // but usually for dev/admin tools we can set it. 
            // Ideally we'd validte the cookie name.

            return {
                success: true,
                sessionToken
            };
        }),


    createCompany: superadminProcedure
        .input(
            z.object({
                name: z.string().min(1),
                slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
                ownerEmail: z.string().email(),
                ownerName: z.string().min(1),
                serviceName: z.string().optional().default("Consulta General"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { prisma } = ctx;
            const { auth } = await import("../../../lib/auth"); // Dynamic import to avoid cycles if any

            // 1. Check if user exists or create
            let user = await prisma.user.findUnique({ where: { email: input.ownerEmail } });

            if (!user) {
                await auth.api.signUpEmail({
                    body: {
                        email: input.ownerEmail,
                        password: "password123", // Default password
                        name: input.ownerName,
                    },
                    asResponse: false // internal call
                });
                // Fetch again to get ID
                user = await prisma.user.findUnique({ where: { email: input.ownerEmail } });
            }

            if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create/find user" });

            // 2. Create Company
            const company = await prisma.company.create({
                data: {
                    name: input.name,
                    slug: input.slug,
                    status: "ACTIVE",
                    language: "es",
                    currency: "MXN",
                    timezone: "America/Mexico_City",
                    subscriptionTier: "PROFESSIONAL",
                    subscriptionStatus: "ACTIVE",
                    // Default template (assuming one exists, or null)
                    // We might want to find default template
                },
            });

            // Find default template
            const defaultTemplate = await prisma.template.findFirst({ where: { storagePath: "default" } });
            if (defaultTemplate) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { siteTemplateId: defaultTemplate.id }
                });
            }

            // 3. Link Owner
            await prisma.userCompany.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    role: "OWNER",
                    status: "ACTIVE",
                },
            });

            // 4. Branding
            await prisma.companyBranding.create({
                data: {
                    companyId: company.id,
                    primaryColor: "#3B82F6",
                    secondaryColor: "#10B981",
                    brandTone: "profesional",
                    brandKeywords: ["belleza", "salud"],
                },
            });

            // 5. Location
            const location = await prisma.location.create({
                data: {
                    companyId: company.id,
                    name: "Sede Principal",
                    address: "Calle Principal #123",
                    city: "Ciudad",
                    country: "País",
                    phone: "+57 300 123 4567",
                    email: input.ownerEmail,
                },
            });

            // 6. Resource (Professional)
            const resource = await prisma.resource.create({
                data: {
                    companyId: company.id,
                    locationId: location.id,
                    userId: user.id,
                    type: "PROFESSIONAL",
                    name: input.ownerName,
                    description: "Profesional Principal",
                    status: "ACTIVE",
                    image: "https://randomuser.me/api/portraits/lego/1.jpg" // Placeholder
                }
            });

            // Availability
            const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
            for (const day of days) {
                await prisma.availability.create({
                    data: {
                        resourceId: resource.id,
                        dayOfWeek: day as DayOfWeek,
                        startTime: "09:00",
                        endTime: "18:00",
                        isAvailable: true
                    }
                });
            }

            // 7. Service
            await prisma.service.create({
                data: {
                    companyId: company.id,
                    name: input.serviceName,
                    slug: input.serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    description: "Servicio general de consulta y valoración.",
                    duration: 60,
                    price: 50000,
                    isPublic: true,
                    webPage: {
                        create: {
                            displayTitle: input.serviceName,
                            heroImage: "https://placehold.co/600x400",
                            content: `
### Descripción del Servicio

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

#### Beneficios
*   Atención personalizada
*   Profesionales calificados
*   Resultados garantizados
                            `.trim(),
                        }
                    },
                    resources: {
                        create: {
                            resource: { connect: { id: resource.id } }
                        }
                    }
                }
            });

            // 8. Site Settings
            await prisma.company.update({
                where: { id: company.id },
                data: {
                    siteSettings: {
                        contact: {
                            phone: "+57 300 123 4567",
                            email: input.ownerEmail,
                            address: "Calle Principal #123"
                        },
                        pages: {
                            home: {
                                blocks: [
                                    {
                                        id: "hero-1",
                                        type: "hero",
                                        props: {
                                            title: `Bienvenido a ${input.name}`,
                                            subtitle: "Cuidamos de ti con los mejores profesionales y tecnología.",
                                            ctaText: "Agendar Cita",
                                            ctaLink: "/booking",
                                            backgroundImage: "https://placehold.co/1920x600",
                                            alignment: "center"
                                        }
                                    },
                                    {
                                        id: "services-1",
                                        type: "services",
                                        props: {
                                            title: "Nuestros Servicios",
                                            showPrice: true,
                                            showDescription: true
                                        }
                                    },
                                    {
                                        id: "contact-1",
                                        type: "contact",
                                        props: {
                                            title: "Contáctanos",
                                            subtitle: "Estamos para servirte"
                                        }
                                    }
                                ]
                            },
                            about: {
                                blocks: [
                                    {
                                        id: "about-hero",
                                        type: "hero",
                                        props: {
                                            title: "Sobre Nosotros",
                                            subtitle: "Nuestra historia y compromiso.",
                                            backgroundImage: "https://placehold.co/1920x600",
                                            alignment: "center"
                                        }
                                    },
                                    {
                                        id: "about-content",
                                        type: "content",
                                        props: {
                                            title: "Nuestra Misión",
                                            content: "<p>Somos una empresa dedicada a brindar servicios de alta calidad...</p>",
                                            alignment: "left"
                                        }
                                    }
                                ]
                            }
                        }
                    } as Prisma.InputJsonObject
                }
            });

            return { success: true, company };
        }),
});
