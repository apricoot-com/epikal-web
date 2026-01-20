"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { trpc } from "@/src/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: status, isLoading } = trpc.onboarding.getStatus.useQuery();

    // Redirect to onboarding if user has no companies
    useEffect(() => {
        if (!isLoading && status && !status.hasCompanies) {
            router.push("/onboarding");
        }
    }, [status, isLoading, router]);

    // Set active company cookie on first load if not set
    useEffect(() => {
        if (status?.companies && status.companies.length > 0 && !status.activeCompanyId) {
            const firstCompany = status.companies[0];
            document.cookie = `activeCompanyId=${firstCompany.id}; path=/; max-age=${60 * 60 * 24 * 365}`;
        }
    }, [status]);

    // Show loading while checking status
    if (isLoading) {
        return (
            <div className="flex h-screen">
                <div className="w-64 border-r p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
                <div className="flex-1 p-8">
                    <Skeleton className="h-10 w-48 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    // Don't render dashboard if no companies (waiting for redirect)
    if (!status?.hasCompanies) {
        return null;
    }

    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
