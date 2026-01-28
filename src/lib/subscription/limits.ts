import { SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_PLANS, type PlanLimits } from "./plans";

export type ResourceType = | "locations"
    | "services"
    | "teamMembers"
    | "resources";

export type LimitCheck = {
    allowed: boolean;
    reason?: string;
    currentCount?: number;
    limit?: number;
    upgradeRequired?: SubscriptionTier;
};

/**
 * Get the effective limits for a company, merging plan defaults with custom overrides
 */
export function getCompanyLimits(
    tier: SubscriptionTier,
    customLimits?: Partial<PlanLimits> | null
): PlanLimits {
    const planLimits = SUBSCRIPTION_PLANS[tier].limits;
    if (!customLimits) return planLimits;

    return {
        ...planLimits,
        ...customLimits,
    };
}

/**
 * Check if a company can create a new resource of the given type
 */
export function canCreateResource(
    currentCount: number,
    tier: SubscriptionTier,
    resourceType: ResourceType,
    customLimits?: Partial<PlanLimits> | null
): LimitCheck {
    const limits = getCompanyLimits(tier, customLimits);

    // Map resource type to limit key
    const limitKey = `max${capitalize(resourceType)}` as keyof PlanLimits;
    const limit = limits[limitKey];

    // Unlimited
    if (limit === -1 || typeof limit !== "number") {
        return { allowed: true, currentCount };
    }

    // Check limit
    if (currentCount >= limit) {
        const upgradeRequired = getRequiredTierForCount(
            currentCount + 1,
            resourceType
        );

        return {
            allowed: false,
            reason: `Has alcanzado el límite de ${limit} ${getResourceLabel(resourceType)} en tu plan ${SUBSCRIPTION_PLANS[tier].name}.`,
            currentCount,
            limit,
            upgradeRequired,
        };
    }

    return {
        allowed: true,
        currentCount,
        limit,
    };
}

/**
 * Find the minimum tier required to support a given count
 */
function getRequiredTierForCount(
    targetCount: number,
    resourceType: ResourceType
): SubscriptionTier {
    const tiers: SubscriptionTier[] = ["PROFESSIONAL", "TEAM", "ENTERPRISE"];
    const limitKey = `max${capitalize(resourceType)}` as keyof PlanLimits;

    for (const tier of tiers) {
        const limit = SUBSCRIPTION_PLANS[tier].limits[limitKey];
        if (typeof limit === "number" && (limit === -1 || targetCount <= limit)) {
            return tier;
        }
    }

    return "ENTERPRISE";
}

/**
 * Check if a feature is available for a given tier
 */
export function hasFeature(
    tier: SubscriptionTier,
    feature: keyof PlanLimits,
    customLimits?: Partial<PlanLimits> | null
): boolean {
    const limits = getCompanyLimits(tier, customLimits);
    const value = limits[feature];

    // Boolean features
    if (typeof value === "boolean") return value;

    // Numeric limits (-1 = unlimited means feature is available)
    if (typeof value === "number") return value !== 0;

    return false;
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
