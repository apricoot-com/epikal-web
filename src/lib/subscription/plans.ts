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

    PROFESSIONAL: {
        name: "Profesional",
        description: "Para profesionales independientes",
        limits: {
            maxLocations: 1,
            maxServices: 20,
            maxTeamMembers: 1, // 1 profesional (the user themselves)
            maxResources: 5,
            customDomain: false,
            whiteLabel: false,
        },
    },
    TEAM: {
        name: "Clínica / Equipo",
        description: "Para equipos y clínicas en crecimiento",
        limits: {
            maxLocations: 3, // "una o más sedes"
            maxServices: -1,
            maxTeamMembers: 10, // "varios profesionales"
            maxResources: 20,
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
