import { router, publicProcedure } from "../init";
import { companyRouter } from "./company";
import { teamRouter } from "./team";
import { locationRouter } from "./location";
import { onboardingRouter } from "./onboarding";
import { serviceRouter } from "./service";
import { resourceRouter } from "./resource";
import { subscriptionRouter } from "./subscription";
import { analyticsRouter } from "./analytics";
import { bookingRouter } from "./booking";
import { calendarRouter } from "./calendar";
import { customerRouter } from "./customer";
import { storageRouter } from "./storage";
import { reminderRouter } from "./reminder";

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
    service: serviceRouter,
    resource: resourceRouter,
    subscription: subscriptionRouter,
    analytics: analyticsRouter,
    booking: bookingRouter,
    calendar: calendarRouter,
    customer: customerRouter,
    storage: storageRouter,
    reminder: reminderRouter,
});

export type AppRouter = typeof appRouter;

