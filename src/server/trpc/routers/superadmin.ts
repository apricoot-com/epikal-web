
import { z } from "zod";
import { router, superadminProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

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
});
