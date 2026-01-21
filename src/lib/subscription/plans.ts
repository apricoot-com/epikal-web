import { SubscriptionTier } from "@prisma/client";

export type PlanLimits = {
    maxLocations: number; // -1 = unlimited
    maxServices: number;
    maxTeamMembers: number;
    maxResources: number;
    customDomain: boolean;
    whiteLabel: boolean;
};

export type SubscriptionPlan = {
    name: string;
    description: string;
    limits: PlanLimits;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
    FREE: {
        name: "Gratis",
        description: "Perfecto para comenzar",
        limits: {
            maxLocations: 1,
            maxServices: 5,
            maxTeamMembers: 2,
            maxResources: 3,
            customDomain: false,
            whiteLabel: false,
        },
    },
    BASIC: {
        name: "Básico",
        description: "Para pequeños negocios",
        limits: {
            maxLocations: 3,
            maxServices: 20,
            maxTeamMembers: 5,
            maxResources: 10,
            customDomain: false,
            whiteLabel: false,
        },
    },
    PROFESSIONAL: {
        name: "Profesional",
        description: "Para equipos en crecimiento",
        limits: {
            maxLocations: 10,
            maxServices: -1, // unlimited
            maxTeamMembers: 20,
            maxResources: 50,
            customDomain: true,
            whiteLabel: false,
        },
    },
    ENTERPRISE: {
        name: "Empresarial",
        description: "Solución completa y personalizable",
        limits: {
            maxLocations: -1,
            maxServices: -1,
            maxTeamMembers: -1,
            maxResources: -1,
            customDomain: true,
            whiteLabel: true,
        },
    },
} as const;
