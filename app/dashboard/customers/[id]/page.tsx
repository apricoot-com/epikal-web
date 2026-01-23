
"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, Clock, MapPin, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CustomerDetailPage() {
    const params = useParams();
    const customerId = params.id as string;

    const { data: customer, isLoading } = trpc.customer.get.useQuery({ id: customerId });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
    }

    if (!customer) {
        return <div className="p-8 text-center text-red-500">Cliente no encontrado</div>;
    }

    const upcomingBookings = customer.bookings.filter(b => new Date(b.startTime) > new Date());
    const pastBookings = customer.bookings.filter(b => new Date(b.startTime) <= new Date());

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <DashboardHeader title="Detalle del Cliente" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sidebar: Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback className="text-2xl">
                                    {customer.firstName[0]}{customer.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle>{customer.firstName} {customer.lastName}</CardTitle>
                        <CardDescription className="flex flex-col gap-1 mt-2 items-center">
                            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {customer.email}</span>
                            {customer.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {customer.phone}</span>}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {customer.tags.map(tag => (
                                <Badge key={tag}>{tag}</Badge>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center border-t py-4">
                            <div>
                                <div className="text-2xl font-bold">{customer.totalBookings}</div>
                                <div className="text-xs text-gray-500">Citas Totales</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">--</div>
                                <div className="text-xs text-gray-500">LTV Est.</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Notas Internas</h4>
                            <div className="bg-slate-50 p-3 rounded-md text-sm text-gray-700 min-h-[100px]">
                                {customer.notes || "Sin notas registradas."}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content: History & Stats */}
                <div className="md:col-span-2 space-y-4">
                    <Tabs defaultValue="bookings">
                        <TabsList>
                            <TabsTrigger value="bookings">Historial de Citas</TabsTrigger>
                            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bookings" className="space-y-4">
                            {/* Upcoming */}
                            {upcomingBookings.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-500" /> Próximas Citas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2">
                                        {upcomingBookings.map(booking => (
                                            <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg bg-blue-50/50">
                                                <div>
                                                    <div className="font-medium">{booking.service.name}</div>
                                                    <div className="text-sm text-gray-500">{format(new Date(booking.startTime), "PPP 'a las' p", { locale: es })}</div>
                                                </div>
                                                <Badge variant="outline">{booking.status}</Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Past History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Historial Reciente</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {pastBookings.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No hay historial previo.</p>
                                        ) : (
                                            pastBookings.map(booking => (
                                                <div key={booking.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div className="flex gap-3">
                                                        <div className="mt-1 bg-gray-100 p-2 rounded-full">
                                                            <Calendar className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{booking.service.name}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(booking.startTime), "PPP", { locale: es })} • {format(new Date(booking.startTime), "p")}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">Atendido por: {booking.resource.name}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="stats">
                            <Card>
                                <CardHeader><CardTitle>Análisis de Cliente</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-gray-500">Próximamente: Gráficos de frecuencia y servicios preferidos.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
