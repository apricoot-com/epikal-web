
"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Mail, Phone, Calendar, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const { data, isLoading } = trpc.customer.list.useQuery({
        search: search || undefined,
        limit: 50,
    });

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <DashboardHeader title="Clientes">
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </DashboardHeader>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1">
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                        ))}
                    </div>
                ) : data?.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <User className="size-12 text-muted-foreground mb-4" />
                        <CardTitle className="mb-2">No se encontraron clientes</CardTitle>
                        <p className="text-muted-foreground text-center">
                            Intenta ajustar tu búsqueda o crea un nuevo cliente.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data?.items.map((customer) => (
                            <Card
                                key={customer.id}
                                className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
                                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                            >
                                <CardHeader className="pb-3 px-4 pt-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                                {customer.firstName[0]}
                                                {customer.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                                                {customer.firstName} {customer.lastName}
                                            </CardTitle>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                                <Mail className="size-3" />
                                                {customer.email}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-3">
                                    {customer.phone && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="size-3" />
                                            <span>{customer.phone}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-1 flex-wrap">
                                        {customer.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-muted text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Hash className="size-3" />
                                            <span>{customer.totalBookings} citas</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            <span>
                                                {customer.lastBookingAt
                                                    ? `Hace ${formatDistanceToNow(new Date(customer.lastBookingAt), { locale: es })}`
                                                    : "Sin citas"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
