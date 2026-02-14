import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@/src/server/db/client";
import { auth } from "@/src/lib/auth";
import { isSuperadmin } from "@/src/lib/superadmin";
import { headers, cookies } from "next/headers";

/**
 * Creates context for tRPC requests.
 * Includes:
 * - Prisma client
 * - User session from Better Auth
 * - Active company/tenant (from cookie or user's first company)
 * - Superadmin flag
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
    // Get session from Better Auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Check if user is a superadmin
    const userIsSuperadmin = isSuperadmin(session?.user?.email);

    // Get user's active company if authenticated
    let company: {
        id: string;
        slug: string;
        name: string;
        subscriptionTier: any;
        subscriptionStatus: any;
        subscriptionEndsAt: any;
        customLimits: any;
        subscriptionData: any;
        siteSettings: any;
        socialUrls: any;
    } | null = null;

    if (session?.user) {
        // Check for active company cookie
        const cookieStore = await cookies();
        const activeCompanyId = cookieStore.get("activeCompanyId")?.value;

        if (activeCompanyId) {
            // 1. Try to find membership normally
            let companyRecord = null;
            let membership = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: activeCompanyId,
                    status: "ACTIVE",
                },
                include: {
                    company: true,
                },
            });

            if (membership) {
                companyRecord = membership.company;
            } else if (userIsSuperadmin) {
                // God Mode: If superadmin but no membership, fetch the company directly
                companyRecord = await prisma.company.findUnique({
                    where: { id: activeCompanyId }
                });
            }

            if (companyRecord) {
                const subData = (companyRecord.subscriptionData as any) || {};
                company = {
                    id: companyRecord.id,
                    slug: companyRecord.slug,
                    name: companyRecord.name,
                    subscriptionTier: subData.tier || "FREE",
                    subscriptionStatus: subData.status || "ACTIVE",
                    subscriptionEndsAt: subData.endsAt || null,
                    customLimits: subData.customLimits || null,
                    subscriptionData: subData,
                    siteSettings: companyRecord.siteSettings,
                    socialUrls: companyRecord.socialUrls,
                };
            }
        }

        // Fallback to first company if no valid cookie
        if (!company) {
            const membership = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    status: "ACTIVE",
                },
                include: {
                    company: true,
                },
            });

            if (membership) {
                const subData = (membership.company.subscriptionData as any) || {};
                company = {
                    id: membership.company.id,
                    slug: membership.company.slug,
                    name: membership.company.name,
                    subscriptionTier: subData.tier || "FREE",
                    subscriptionStatus: subData.status || "ACTIVE",
                    subscriptionEndsAt: subData.endsAt || null,
                    customLimits: subData.customLimits || null,
                    subscriptionData: subData,
                    siteSettings: membership.company.siteSettings,
                    socialUrls: membership.company.socialUrls,
                };
            }
        }
    }

    return {
        prisma,
        user: session?.user ?? null,
        session: session?.session ?? null,
        company,
        isSuperadmin: userIsSuperadmin,
        headers: opts?.req.headers,
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
