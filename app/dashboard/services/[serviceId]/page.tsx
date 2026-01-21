"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { trpc } from "@/src/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export default function ServiceEditorPage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId as string;
    const isNew = serviceId === "new";

    const { data: service, isLoading: isLoadingService } = trpc.service.get.useQuery(
        { id: serviceId },
        { enabled: !isNew }
    );

    // Core Service Data State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [duration, setDuration] = useState<number>(60);
    const [allowsDeposit, setAllowsDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [isPublic, setIsPublic] = useState(true);

    // Initial Load
    useEffect(() => {
        if (service) {
            setName(service.name);
            setDescription(service.description || "");
            setPrice(service.price);
            setDuration(service.duration);
            setAllowsDeposit(service.allowsDeposit);
            setDepositAmount(service.depositAmount || 0);
            setIsPublic(service.isPublic);
        }
    }, [service]);

    const utils = trpc.useUtils();

    const createService = trpc.service.create.useMutation({
        onSuccess: (data) => {
            toast.success("Service created successfully");
            utils.service.list.invalidate();
            router.push(`/dashboard/services/${data.id}`);
        },
        onError: (err) => toast.error("Error creating service: " + err.message)
    });

    const updateService = trpc.service.update.useMutation({
        onSuccess: () => {
            toast.success("Service saved successfully");
            utils.service.get.invalidate({ id: serviceId });
            utils.service.list.invalidate();
        },
        onError: (err) => toast.error("Error saving service: " + err.message)
    });

    const handleSave = () => {
        if (isNew) {
            createService.mutate({
                name,
                description,
                price,
                duration,
                allowsDeposit,
                depositAmount: allowsDeposit ? depositAmount : undefined,
                isPublic,
                resourceIds: [] // TODO: Add resource selector
            });
        } else {
            updateService.mutate({
                id: serviceId,
                name,
                description,
                price,
                duration,
                allowsDeposit,
                depositAmount: allowsDeposit ? depositAmount : null,
                isPublic
            });
        }
    };

    if (isLoadingService && !isNew) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const isSaving = createService.isPending || updateService.isPending;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="border-b bg-background p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/services")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold">{isNew ? "New Service" : name || "Edit Service"}</h1>
                        <p className="text-xs text-muted-foreground">{isNew ? "Create a new service" : "Manage service details and settings"}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-[2fr_1fr]">

                    {/* Main Content */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Details</CardTitle>
                                <CardDescription>The core information shown to your clients.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Service Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Deep Tissue Massage"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        placeholder="Describe the service..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & Duration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Price ($)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={price}
                                            onChange={(e) => setPrice(parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration (min)</Label>
                                        <Input
                                            type="number"
                                            min={5}
                                            step={5}
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Require Deposit</Label>
                                        <p className="text-sm text-muted-foreground">Charge a partial amount at booking</p>
                                    </div>
                                    <Switch checked={allowsDeposit} onCheckedChange={setAllowsDeposit} />
                                </div>

                                {allowsDeposit && (
                                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                        <Label>Deposit Amount ($)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Aside */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Publicly Visible</Label>
                                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    If disabled, this service won't show on your booking site.
                                </p>
                            </CardContent>
                        </Card>

                        {!isNew && (
                            <Card className="bg-muted/10 border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base text-muted-foreground">Resources</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Assign staff or rooms required for this service.
                                    </p>
                                    {/* Link to Resources Tab (Future) */}
                                    <Button variant="outline" className="w-full" disabled>
                                        Manage Resources
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {!isNew && (
                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this service?")) {
                                            // TODO: Specific delete mutation
                                            // For now relies on list page delete
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Service
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
