import { z } from "zod";
import { router, companyProcedure } from "../init";
import { TRPCError } from "@trpc/server";

/**
 * Team router
 * Handles team member management for a company
 */
export const teamRouter = router({
    /**
     * List all company members
     */
    list: companyProcedure.query(async ({ ctx }) => {
        const members = await ctx.prisma.userCompany.findMany({
            where: {
                companyId: ctx.company.id,
                status: { in: ["ACTIVE", "INVITED"] },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: [
                { role: "asc" }, // OWNER first
                { createdAt: "asc" },
            ],
        });

        return members;
    }),

    /**
     * Get current user's role in company
     */
    myRole: companyProcedure.query(async ({ ctx }) => {
        const membership = await ctx.prisma.userCompany.findFirst({
            where: {
                userId: ctx.user.id,
                companyId: ctx.company.id,
                status: "ACTIVE",
            },
        });

        return membership?.role ?? null;
    }),

    /**
     * Update a member's role
     * Only OWNER can change roles
     */
    updateRole: companyProcedure
        .input(
            z.object({
                userId: z.string(),
                role: z.enum(["ADMIN", "STAFF", "VIEWER"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner
            const myMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: ctx.company.id,
                    status: "ACTIVE",
                },
            });

            if (myMembership?.role !== "OWNER") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can change roles",
                });
            }

            // Cannot change own role
            if (input.userId === ctx.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot change your own role",
                });
            }

            // Get target membership
            const targetMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: input.userId,
                    companyId: ctx.company.id,
                },
            });

            if (!targetMembership) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });
            }

            // Cannot demote another owner
            if (targetMembership.role === "OWNER") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot change the role of an owner",
                });
            }

            const updated = await ctx.prisma.userCompany.update({
                where: { id: targetMembership.id },
                data: { role: input.role },
            });

            return updated;
        }),

    /**
     * Remove a member from the company
     * Only OWNER can remove members
     */
    remove: companyProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner
            const myMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: ctx.company.id,
                    status: "ACTIVE",
                },
            });

            if (myMembership?.role !== "OWNER") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can remove members",
                });
            }

            // Cannot remove self
            if (input.userId === ctx.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot remove yourself from the company",
                });
            }

            // Get target membership
            const targetMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: input.userId,
                    companyId: ctx.company.id,
                },
            });

            if (!targetMembership) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });
            }

            // Cannot remove another owner
            if (targetMembership.role === "OWNER") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot remove an owner",
                });
            }

            await ctx.prisma.userCompany.update({
                where: { id: targetMembership.id },
                data: { status: "REVOKED" },
            });

            return { success: true };
        }),

    /**
     * Invite a new member to the company
     * OWNER or ADMIN can invite
     */
    invite: companyProcedure
        .input(
            z.object({
                email: z.string().email(),
                name: z.string().min(1).max(100),
                role: z.enum(["ADMIN", "STAFF", "VIEWER"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner or admin
            const myMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: ctx.user.id,
                    companyId: ctx.company.id,
                    status: "ACTIVE",
                },
            });

            if (!myMembership || !["OWNER", "ADMIN"].includes(myMembership.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only owners and admins can invite members",
                });
            }

            // Check if user already exists
            let user = await ctx.prisma.user.findUnique({
                where: { email: input.email.toLowerCase() },
            });

            // Create user if doesn't exist
            if (!user) {
                user = await ctx.prisma.user.create({
                    data: {
                        email: input.email.toLowerCase(),
                        name: input.name,
                        emailVerified: false,
                    },
                });
            }

            // Check if already a member
            const existingMembership = await ctx.prisma.userCompany.findFirst({
                where: {
                    userId: user.id,
                    companyId: ctx.company.id,
                },
            });

            if (existingMembership) {
                if (existingMembership.status === "REVOKED") {
                    // Re-invite previously removed member
                    await ctx.prisma.userCompany.update({
                        where: { id: existingMembership.id },
                        data: {
                            status: "INVITED",
                            role: input.role,
                        },
                    });
                } else {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "User is already a member of this company",
                    });
                }
            } else {
                // Create new membership
                await ctx.prisma.userCompany.create({
                    data: {
                        userId: user.id,
                        companyId: ctx.company.id,
                        role: input.role,
                        status: "INVITED",
                    },
                });
            }

            // TODO: Send invitation email via MailProvider

            return { success: true, userId: user.id };
        }),
});
