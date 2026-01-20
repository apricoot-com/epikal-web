import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/src/server/db/client";

/**
 * Better Auth server configuration
 * 
 * Uses existing Prisma schema with custom table mappings.
 * Start with email/password - social providers can be added later.
 */
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },

    // Trust proxy for production behind load balancer
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ],
});

export type Session = typeof auth.$Infer.Session;
