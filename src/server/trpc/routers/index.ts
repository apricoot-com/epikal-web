import { router, publicProcedure } from "../init";
import { companyRouter } from "./company";
import { teamRouter } from "./team";
import { locationRouter } from "./location";
import { onboardingRouter } from "./onboarding";

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

    // Module routers
    company: companyRouter,
    team: teamRouter,
    location: locationRouter,
    onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
