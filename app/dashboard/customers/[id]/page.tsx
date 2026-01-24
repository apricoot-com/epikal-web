
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
        <>
            <DashboardHeader
                title={`${customer.firstName} ${customer.lastName}`}
                backHref="/dashboard/customers"
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar Perfil</Button>
                </div>
            </DashboardHeader>

            <div className="flex flex-1 flex-col p-4 gap-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="flex h-auto w-fit gap-1 bg-muted p-1 rounded-lg">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="bookings">Citas</TabsTrigger>
                        <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Información de Contacto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 border">
                                            <AvatarFallback className="text-lg">
                                                {customer.firstName[0]}{customer.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-lg">{customer.firstName} {customer.lastName}</h3>
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 pt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{customer.email}</span>
                                        </div>
                                        {customer.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-wrap gap-1">
                                                {customer.tags.length > 0 ? (
                                                    customer.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sin etiquetas</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notas Internas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground min-h-[120px]">
                                        {customer.notes || "No hay notas internas registradas para este cliente."}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="bookings" className="mt-4 space-y-4">
                        {upcomingBookings.length > 0 && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                                        <Clock className="h-4 w-4" /> Próximas Citas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    {upcomingBookings.map(booking => (
                                        <div key={booking.id} className="flex justify-between items-center p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex gap-4 items-center">
                                                <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{booking.service.name}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        {format(new Date(booking.startTime), "PPP 'a las' p", { locale: es })}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{booking.status}</Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Historial de Citas</CardTitle>
                                <CardDescription>Registro completo de visitas pasadas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pastBookings.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                            <p className="text-muted-foreground">Este cliente aún no tiene citas pasadas.</p>
                                        </div>
                                    ) : (
                                        pastBookings.map(booking => (
                                            <div key={booking.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="mt-1 bg-muted p-2 rounded-full">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{booking.service.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format(new Date(booking.startTime), "PPP", { locale: es })} • {format(new Date(booking.startTime), "p")}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-1 bg-muted w-fit px-1.5 rounded">Atendido por: {booking.resource.name}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={booking.status === 'COMPLETED' ? 'outline' : 'secondary'} className="text-[10px]">
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats" className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-3xl font-bold">{customer.totalBookings}</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Citas Totales</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-3xl font-bold text-primary">--</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Gasto Estimado (LTV)</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-3xl font-bold text-orange-500">Normal</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Frecuencia</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-3xl font-bold">1 mes</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Promedio Retransmisión</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Análisis de Comportamiento</CardTitle>
                                <CardDescription>Basado en el historial de reservas de los últimos 12 meses</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                                <div className="text-center">
                                    <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Próximamente: Gráficos de servicios preferidos y estacionalidad.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
