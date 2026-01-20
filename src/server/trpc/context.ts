import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@/src/server/db/client";

/**
 * Creates context for tRPC requests.
 * Includes:
 * - Prisma client
 * - User session (to be added with Better Auth)
 * - Active company/tenant (to be added)
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
    // TODO: Add session resolution from Better Auth
    // TODO: Add active company resolution

    return {
        prisma,
        user: null as null | { id: string; email: string; name: string },
        company: null as null | { id: string; slug: string },
        headers: opts?.req.headers,
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
