"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Eye, Users, Award, RefreshCw } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from "sonner";

export default function AnalyticsPage() {
    const { data: overview, isLoading: overviewLoading } =
        trpc.analytics.getOverview.useQuery({ days: 30 });

    const { data: timeline, isLoading: timelineLoading, refetch: refetchTimeline } =
        trpc.analytics.getDailyTimeline.useQuery({ days: 30 });

    const { data: topServices, isLoading: servicesLoading, refetch: refetchServices } =
        trpc.analytics.getTopServices.useQuery({ days: 30, limit: 5 });

    const { data: topSources, isLoading: sourcesLoading, refetch: refetchSources } =
        trpc.analytics.getTopSources.useQuery({ days: 30, limit: 5 });

    const { data: myRole } = trpc.team.myRole.useQuery();

    const forceAggregate = trpc.analytics.forceAggregate.useMutation({
        onSuccess: (result) => {
            toast.success(`Agregación completada: ${result.companiesProcessed}/${result.companiesTotal} empresas procesadas`);
            // Refetch all data
            refetchTimeline();
            refetchServices();
            refetchSources();
        },
        onError: (error) => {
            toast.error("Error al agregar datos: " + error.message);
        }
    });

    const handleForceAggregate = () => {
        forceAggregate.mutate();
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    const isAdmin = myRole === 'OWNER' || myRole === 'ADMIN';

    return (
        <>
            <DashboardHeader title="Analíticas" />
            <div className="flex flex-1 flex-col p-4">
                {/* Admin Controls */}
                {isAdmin && (
                    <div className="mb-4 flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleForceAggregate}
                            disabled={forceAggregate.isPending}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${forceAggregate.isPending ? 'animate-spin' : ''}`} />
                            {forceAggregate.isPending ? 'Agregando...' : 'Forzar Agregación (Admin)'}
                        </Button>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                    <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vistas Totales</p>
                                    {overviewLoading ? (
                                        <Skeleton className="h-8 w-20" />
                                    ) : (
                                        <p className="text-2xl font-bold">{overview?.totalPageViews || 0}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
                                    {overviewLoading ? (
                                        <Skeleton className="h-8 w-20" />
                                    ) : (
                                        <p className="text-2xl font-bold">{overview?.totalUniqueVisitors || 0}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                                    <Award className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Servicio Top</p>
                                    {servicesLoading ? (
                                        <Skeleton className="h-8 w-32" />
                                    ) : (
                                        <p className="text-lg font-bold truncate">
                                            {topServices?.[0]?.name || 'N/A'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Fuente Principal</p>
                                    {sourcesLoading ? (
                                        <Skeleton className="h-8 w-24" />
                                    ) : (
                                        <p className="text-lg font-bold">
                                            {topSources?.[0]?.source || 'Directo'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Timeline Chart */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Vistas Diarias (Últimos 30 días)</h2>
                        {timelineLoading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : timeline && timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timeline}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: es })}
                                        className="text-xs"
                                    />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        labelFormatter={(date) => format(new Date(date), 'PPP', { locale: es })}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pageViews"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        name="Vistas"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                No hay datos disponibles
                            </div>
                        )}
                    </Card>

                    {/* Top Services & Sources */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Servicios Más Vistos</h2>
                            {servicesLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : topServices && topServices.length > 0 ? (
                                <div className="space-y-3">
                                    {topServices.map((service: any, idx: number) => (
                                        <div key={service.id} className="flex justify-between items-center">
                                            <span className="font-medium">{idx + 1}. {service.name}</span>
                                            <span className="text-muted-foreground">{service.views} vistas</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No hay datos disponibles
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Fuentes de Tráfico</h2>
                            {sourcesLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : topSources && topSources.length > 0 ? (
                                <div className="space-y-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={topSources}
                                                dataKey="views"
                                                nameKey="source"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={(props: any) => `${props.source} (${(props.percent * 100).toFixed(0)}%)`}
                                            >
                                                {topSources.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2">
                                        {topSources.map((source: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                />
                                                <span className="text-sm">{source.source}: {source.views} vistas</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No hay datos disponibles
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* CTA for Advanced Analytics */}
                    <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                        <h3 className="text-lg font-semibold mb-2">¿Necesitas analíticas más detalladas?</h3>
                        <p className="text-muted-foreground mb-4">
                            Configura Google Tag Manager para obtener insights avanzados con GA4, eventos personalizados y más.
                        </p>
                        <a
                            href="/dashboard/settings/integrations"
                            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                            Configurar Integraciones →
                        </a>
                    </Card>
                </div>
            </div>
        </>
    );
}
