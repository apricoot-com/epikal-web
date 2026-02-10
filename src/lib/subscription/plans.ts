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
    priceInCents?: number;
    limits: PlanLimits;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {

    FREE: {
        name: "Gratis",
        description: "Plan gratuito para comenzar",
        priceInCents: 0,
        limits: {
            maxLocations: 1,
            maxServices: 5,
            maxTeamMembers: 1,
            maxResources: 1,
            customDomain: false,
            whiteLabel: false,
        },
    },
    BASIC: {
        name: "Básico",
        description: "Para pequeños negocios",
        priceInCents: 1500,
        limits: {
            maxLocations: 1,
            maxServices: 10,
            maxTeamMembers: 1,
            maxResources: 2,
            customDomain: false,
            whiteLabel: false,
        },
    },
    PROFESSIONAL: {
        name: "Profesional",
        description: "Para profesionales independientes",
        priceInCents: 2900,
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
        priceInCents: 7900,
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
