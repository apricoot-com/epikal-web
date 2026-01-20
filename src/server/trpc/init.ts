import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

/**
 * tRPC initialization with context and transformer
 */
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape }) {
        return shape;
    },
});

/**
 * Router and procedure exports
 */
export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure - no auth required
 */
export const publicProcedure = t.procedure;

/**
 * Middleware to enforce authentication
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
        });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user, // Now non-null
        },
    });
});

/**
 * Protected procedure - requires authenticated user
 */
export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * Middleware to enforce company context (multi-tenant)
 */
const enforceCompany = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
        });
    }
    if (!ctx.company) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "No active company selected",
        });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
            company: ctx.company,
        },
    });
});

/**
 * Company-scoped procedure - requires auth + active tenant
 */
export const companyProcedure = t.procedure.use(enforceCompany);

/**
 * Middleware to enforce superadmin access
 */
const enforceSuperadmin = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
        });
    }
    if (!ctx.isSuperadmin) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "This action requires superadmin privileges",
        });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
            isSuperadmin: true as const,
        },
    });
});

/**
 * Superadmin procedure - requires superadmin privileges
 * Use for platform-level operations (cross-tenant access, system config, etc.)
 */
export const superadminProcedure = t.procedure.use(enforceSuperadmin);
