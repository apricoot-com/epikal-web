
"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function CustomersPage() {
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

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Etiquetas</TableHead>
                                <TableHead className="text-right">Citas</TableHead>
                                <TableHead className="text-right">Última Visita</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Cargando clientes...
                                    </TableCell>
                                </TableRow>
                            ) : data?.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No se encontraron clientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.items.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {customer.firstName[0]}
                                                        {customer.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>
                                                        {customer.firstName} {customer.lastName}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm text-gray-500">
                                                <span>{customer.email}</span>
                                                <span>{customer.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {customer.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {customer.totalBookings}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-500">
                                            {customer.lastBookingAt ? formatDistanceToNow(new Date(customer.lastBookingAt), { addSuffix: true, locale: es }) : "Nunca"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/customers/${customer.id}`}>Ver</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
