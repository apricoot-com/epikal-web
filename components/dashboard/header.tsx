"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
    title?: string;
    backHref?: string;
    children?: React.ReactNode;
}

export function DashboardHeader({ title, backHref, children }: DashboardHeaderProps) {
    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {backHref && (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={backHref}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            )}
            {title && <h1 className="text-lg font-semibold flex-1">{title}</h1>}
            {children && <div className="flex items-center gap-2">{children}</div>}
        </header>
    );
}
