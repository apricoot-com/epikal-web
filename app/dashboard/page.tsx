import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardPage() {
    return (
        <>
            <DashboardHeader title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Citas hoy</span>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Ingresos mes</span>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                        <span className="text-muted-foreground">Clientes nuevos</span>
                    </div>
                </div>
                <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">
                        Actividad reciente • Próximamente
                    </span>
                </div>
            </div>
        </>
    );
}
