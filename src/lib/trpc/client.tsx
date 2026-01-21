"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/src/server/trpc/routers";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or replace with console/alert if uncertain

/**
 * tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
    if (typeof window !== "undefined") return ""; // Browser
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * tRPC Provider component
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 1000,
                        refetchOnWindowFocus: false,
                        retry: false, // Don't retry on error
                    },
                },
                queryCache: new QueryCache({
                    onError: (error: any) => {
                        // Check if it's a TRPC error with UNAUTHORIZED code
                        if (error?.data?.code === "UNAUTHORIZED") {
                            // Redirect to login
                            router.push("/login");
                        }
                    },
                }),
                mutationCache: new MutationCache({
                    onError: (error: any) => {
                        // Check if it's a TRPC error with UNAUTHORIZED code
                        if (error?.data?.code === "UNAUTHORIZED") {
                            // Redirect to login
                            router.push("/login");
                        }
                    }
                })
            })
    );

    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    transformer: superjson,
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
