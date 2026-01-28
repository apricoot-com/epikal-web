import { trpc } from "@/src/lib/trpc/client";
import type { ResourceType } from "@/src/lib/subscription/limits";

export function useSubscription() {
    const { data: subscription, isLoading, refetch } =
        trpc.subscription.getMySubscription.useQuery();

    /**
     * Check if the company can create a new resource of the given type
     */
    const canCreate = (resourceType: ResourceType) => {
        if (!subscription) {
            return {
                allowed: false,
                reason: "Loading subscription data...",
            };
        }

        const usage = subscription.usage[resourceType];
        const limitKey = `max${capitalize(resourceType)}` as keyof typeof subscription.limits;
        const limit = subscription.limits[limitKey];

        // Unlimited
        if (typeof limit === "number" && limit === -1) {
            return {
                allowed: true,
                currentCount: usage,
            };
        }

        // Check limit
        if (typeof limit === "number" && usage >= limit) {
            return {
                allowed: false,
                currentCount: usage,
                limit,
                tier: subscription.tier,
                reason: `Has alcanzado el límite de ${limit} ${getResourceLabel(resourceType)} en tu plan ${subscription.planName}.`,
            };
        }

        return {
            allowed: true,
            currentCount: usage,
            limit: typeof limit === "number" ? limit : undefined,
        };
    };

    /**
     * Check if a boolean feature is available
     */
    const hasFeature = (feature: "customDomain" | "whiteLabel") => {
        if (!subscription) return false;
        return subscription.limits[feature] === true;
    };

    return {
        subscription,
        canCreate,
        hasFeature,
        isLoading,
        refetch,
    };
}

// Helper functions
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getResourceLabel(resourceType: ResourceType): string {
    const labels: Record<ResourceType, string> = {
        locations: "ubicaciones",
        services: "servicios",
        teamMembers: "miembros del equipo",
        resources: "recursos",
    };
    return labels[resourceType];
}
