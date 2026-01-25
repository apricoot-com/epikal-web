"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/src/server/trpc/routers";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or replace with console/alert if uncertain

import { Copy } from "lucide-react";
import { truncate } from "@/lib/utils";

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

    const handleErrorToast = (error: any, fallbackMessage: string) => {
        // Check if it's a TRPC error with UNAUTHORIZED code
        if (error?.data?.code === "UNAUTHORIZED") {
            router.push("/login");
            return;
        }

        const message = error.message || fallbackMessage;
        const displayMessage = truncate(message, 120);

        toast.error(displayMessage, {
            description: (
                <div className="flex justify-start mt-0.5">
                    <button
                        onClick={() => {
                            const errorDetails = JSON.stringify({
                                message: error.message,
                                code: error.data?.code,
                                path: error.data?.path,
                                stack: error.data?.stack,
                            }, null, 2);
                            navigator.clipboard.writeText(errorDetails);
                            toast.success("Copiado", { duration: 1000 });
                        }}
                        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground/30 hover:text-foreground"
                        title="Copiar detalles técnicos"
                    >
                        <Copy className="size-3" />
                    </button>
                </div>
            )
        });
    };

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
                    onError: (error: any) => handleErrorToast(error, "Ocurrió un error inesperado"),
                }),
                mutationCache: new MutationCache({
                    onError: (error: any) => handleErrorToast(error, "Error al realizar la operación"),
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
