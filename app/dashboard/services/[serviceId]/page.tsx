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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, GripVertical, Trash2, DollarSign, Clock } from "lucide-react";
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
                <div className="max-w-4xl mx-auto">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            <TabsTrigger value="general">Details</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing</TabsTrigger>
                            <TabsTrigger value="resources" disabled={isNew}>Resources</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="grid gap-6 md:grid-cols-[2fr_1fr]">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Basic Information</CardTitle>
                                        <CardDescription>Internal details for this service.</CardDescription>
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
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Visibility</CardTitle>
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
                                    <Card className="border-dashed bg-muted/10">
                                        <CardContent className="pt-6">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Service
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pricing & Duration</CardTitle>
                                    <CardDescription>Set the cost and time required for this service.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Price ($)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="pl-9"
                                                    value={price}
                                                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Duration (Minutes)</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    min={5}
                                                    step={5}
                                                    className="pl-9"
                                                    value={duration}
                                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
                                        <div className="space-y-0.5">
                                            <Label>Require Deposit</Label>
                                            <p className="text-sm text-muted-foreground">Charge a partial amount online to secure the booking.</p>
                                        </div>
                                        <Switch checked={allowsDeposit} onCheckedChange={setAllowsDeposit} />
                                    </div>

                                    {allowsDeposit && (
                                        <div className="space-y-2 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-left-2">
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
                        </TabsContent>

                        <TabsContent value="resources">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resources & Staff</CardTitle>
                                    <CardDescription>Manage who and what is needed for this service.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="bg-muted rounded-full p-3 mb-4">
                                            <GripVertical className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Resource Management Coming Soon</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                            You will be able to assign specific staff members and rooms to this service here.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
