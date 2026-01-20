import { router, publicProcedure } from "../init";

/**
 * Root router for all tRPC endpoints
 * Add new module routers here
 */
export const appRouter = router({
    /**
     * Health check endpoint
     */
    health: publicProcedure.query(() => {
        return { status: "ok", timestamp: new Date().toISOString() };
    }),

    // TODO: Add module routers
    // company: companyRouter,
    // services: servicesRouter,
    // scheduling: schedulingRouter,
});

export type AppRouter = typeof appRouter;
