"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    Calendar,
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Building2,
    LogOut,
    ChevronDown,
    Plus,
    Check,
    Globe,
    User,
    Shield,
    CalendarClock,
    CreditCard,
    LayoutTemplate,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "@/src/lib/auth-client";
import { trpc } from "@/src/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPERADMIN", "OWNER", "ADMIN", "STAFF", "VIEWER"],
    },
    {
        title: "Servicios",
        href: "/dashboard/services",
        icon: Briefcase,
        roles: ["SUPERADMIN", "OWNER", "ADMIN"],
    },
    {
        title: "Agenda",
        href: "/dashboard/calendar",
        icon: Calendar,
        roles: ["SUPERADMIN", "OWNER", "ADMIN", "STAFF", "VIEWER"],
    },
    {
        title: "Clientes",
        href: "/dashboard/customers",
        icon: Users,
        roles: ["SUPERADMIN", "OWNER", "ADMIN", "STAFF"],
    },
    {
        title: "Agente IA",
        href: "/dashboard/ai",
        icon: MessageSquare,
        roles: ["SUPERADMIN", "OWNER", "ADMIN"],
    },
    {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        roles: ["SUPERADMIN", "OWNER"],
    },
    {
        title: "Mi Perfil",
        href: "/dashboard/profile",
        icon: User,
        roles: ["STAFF", "OWNER", "ADMIN"],
    },
    {
        title: "Super Admin",
        href: "/dashboard/superadmin/companies",
        icon: Shield,
        roles: ["SUPERADMIN"],
    },
    {
        title: "Plantillas",
        href: "/dashboard/superadmin/templates",
        icon: LayoutTemplate,
        roles: ["SUPERADMIN"],
    },
];

const settingsItems = [
    {
        title: "Profesionales",
        href: "/dashboard/services/team",
        icon: Users,
        roles: ["SUPERADMIN", "OWNER", "ADMIN"],
    },
    {
        title: "Instalaciones",
        href: "/dashboard/services/facilities",
        icon: Building2,
        roles: ["SUPERADMIN", "OWNER", "ADMIN"],
    },
    {
        title: "Empresa",
        href: "/dashboard/company",
        icon: Building2,
        roles: ["SUPERADMIN", "OWNER"],
    },
    {
        title: "Equipo",
        href: "/dashboard/company/team",
        icon: Users,
        roles: ["SUPERADMIN", "OWNER"],
    },
    {
        title: "Sitio Web",
        href: "/dashboard/site",
        icon: Globe,
        roles: ["SUPERADMIN", "OWNER"],
    },
    {
        title: "Agendamiento",
        href: "/dashboard/booking-settings",
        icon: CalendarClock,
        roles: ["SUPERADMIN", "OWNER", "ADMIN"],
    },
    {
        title: "Facturación",
        href: "/dashboard/settings/billing",
        icon: CreditCard,
        roles: ["SUPERADMIN", "OWNER"],
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending: sessionPending } = useSession();
    const { data: status, refetch: refetchStatus } = trpc.onboarding.getStatus.useQuery();
    const isSuperadmin = status?.isSuperadmin || false;
    const setActiveCompany = trpc.onboarding.setActiveCompany.useMutation({
        onSuccess: (company) => {
            document.cookie = `activeCompanyId=${company.id}; path=/; max-age=${60 * 60 * 24 * 365}`;
            refetchStatus();
            router.refresh();
        },
    });

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    const handleSwitchCompany = (companyId: string) => {
        setActiveCompany.mutate({ companyId });
    };

    // Get user initials for avatar
    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Find active company and role
    const activeCompany = status?.companies?.find((c: any) => c.id === status.activeCompanyId);
    const userRole = (activeCompany?.role || status?.companies?.[0]?.role || "STAFF") as any;
    const currentCompanyName = activeCompany?.name ?? status?.companies?.[0]?.name ?? "Empresa";

    // Filter items based on role
    const filteredNavItems = navItems.filter(item => {
        // If isSuperadmin flag is true, show items that allow SUPERADMIN
        if (isSuperadmin && item.roles.includes("SUPERADMIN")) return true;
        // Otherwise check user role
        return item.roles.includes(userRole);
    });
    const filteredSettingsItems = settingsItems.filter(item => {
        if (isSuperadmin && item.roles.includes("SUPERADMIN")) return true;
        return item.roles.includes(userRole);
    });

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                {/* Company Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="w-full">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                                {currentCompanyName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden min-w-0 flex-1">
                                <span className="text-sm font-semibold truncate max-w-full">
                                    {currentCompanyName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {status?.companies?.length === 1
                                        ? "1 empresa"
                                        : `${status?.companies?.length ?? 0} empresas`}
                                </span>
                            </div>
                            <ChevronDown className="size-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start" className="w-64">
                        {status?.companies?.map((company: any) => (
                            <DropdownMenuItem
                                key={company.id}
                                onClick={() => handleSwitchCompany(company.id)}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex size-6 items-center justify-center rounded bg-muted text-xs font-medium">
                                        {company.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{company.name}</span>
                                </div>
                                {(company.id === status.activeCompanyId ||
                                    (!status.activeCompanyId && company.id === status.companies?.[0]?.id)) && (
                                        <Check className="size-4" />
                                    )}
                            </DropdownMenuItem>
                        ))}
                        {status?.canCreateCompany && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/onboarding")}>
                                    <Plus className="size-4 mr-2" />
                                    Crear nueva empresa
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarHeader>

            <SidebarContent>
                {filteredNavItems.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredNavItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {filteredSettingsItems.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Administración</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredSettingsItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <Avatar className="size-8">
                                        <AvatarFallback>
                                            {sessionPending ? (
                                                <Skeleton className="size-full rounded-full" />
                                            ) : (
                                                getInitials(session?.user?.name)
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden min-w-0">
                                        {sessionPending ? (
                                            <>
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-3 w-32 mt-1" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium truncate max-w-full">
                                                    {session?.user?.name || "Usuario"}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-full">
                                                    {session?.user?.email || ""}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-56">
                                <DropdownMenuItem>Perfil</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
