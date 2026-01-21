"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/src/lib/trpc/client";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCKS, BlockType, SiteBlock } from "@/src/lib/templating/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, Trash2, Save, ArrowLeft } from "lucide-react";
import { z } from "zod";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { BlockPreview } from "./block-preview";
import { Badge } from "@/components/ui/badge";

// --- Props Form Component (Enhanced) ---
function BlockPropsForm({
    block,
    onChange
}: {
    block: SiteBlock;
    onChange: (id: string, newProps: any) => void;
}) {
    const blockDef = BLOCKS[block.type];

    if (!blockDef) return <div>Unknown block type</div>;

    const schemaShape = (blockDef.schema as any).shape;

    // Helper to render input based on schema type
    const renderField = (key: string, zodType: any) => {
        const value = block.props[key] ?? "";

        const handleInjectVariable = (variable: string) => {
            onChange(block.id, { ...block.props, [key]: value + variable });
        };

        const renderLabelWithVariables = () => (
            <div className="flex justify-between items-center">
                <Label className="capitalize">{key}</Label>
                {/* Dynamic Variable Helper */}
                {(zodType instanceof z.ZodString) && (
                    <div className="flex gap-1">
                        {['${company.name}', '${company.phone}', '${service.name}', '${service.description}'].map(v => (
                            <Badge
                                key={v}
                                variant="outline"
                                className="cursor-pointer hover:bg-muted text-[10px] h-5 px-1 font-mono text-muted-foreground"
                                onClick={() => handleInjectVariable(v)}
                            >
                                {v}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        );

        // String
        if (zodType instanceof z.ZodString) {
            if (key === 'content' || key === 'description' || key === 'answer') {
                return (
                    <div key={key} className="space-y-2">
                        {renderLabelWithVariables()}
                        <Textarea
                            value={value}
                            onChange={(e) => onChange(block.id, { ...block.props, [key]: e.target.value })}
                            rows={6}
                            className="font-mono text-sm"
                        />
                    </div>
                );
            }
            return (
                <div key={key} className="space-y-2">
                    {renderLabelWithVariables()}
                    <Input
                        value={value}
                        onChange={(e) => onChange(block.id, { ...block.props, [key]: e.target.value })}
                    />
                </div>
            );
        }

        // Boolean
        if (zodType instanceof z.ZodBoolean) {
            return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="capitalize">{key}</Label>
                    <Switch
                        checked={!!value}
                        onCheckedChange={(checked: boolean) => onChange(block.id, { ...block.props, [key]: checked })}
                    />
                </div>
            );
        }

        // Number
        if (zodType instanceof z.ZodNumber) {
            return (
                <div key={key} className="space-y-2">
                    <Label className="capitalize">{key}</Label>
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(block.id, { ...block.props, [key]: parseFloat(e.target.value) })}
                    />
                </div>
            );
        }

        // Enum (ZodEnum) logic checks usually involve _def.values
        if (zodType._def?.typeName === "ZodEnum") {
            return (
                <div key={key} className="space-y-2">
                    <Label className="capitalize">{key}</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={value}
                        onChange={(e) => onChange(block.id, { ...block.props, [key]: e.target.value })}
                    >
                        {zodType._def.values.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        }

        // Array (simplified for now - e.g. features list)
        if (zodType instanceof z.ZodArray) {
            return (
                <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} (JSON)</Label>
                    <Textarea
                        className="font-mono text-xs"
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                onChange(block.id, { ...block.props, [key]: parsed });
                            } catch (err) {
                                // Invalid JSON
                            }
                        }}
                        rows={6}
                    />
                    <p className="text-xs text-muted-foreground">Edit strictly as JSON.</p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            {Object.entries(schemaShape).map(([key, schema]) => renderField(key, schema))}
        </div>
    );
}

// --- Sortable Item Component (Updated) ---
function SortableBlockItem({
    block,
    onEdit,
    onDelete
}: {
    block: SiteBlock;
    onEdit: () => void;
    onDelete: (e: React.MouseEvent) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const blockDef = BLOCKS[block.type];

    return (
        <div ref={setNodeRef} style={style} className="mb-6 relative group">
            {/* Action Bar (Visible on Hover) */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button size="sm" variant="secondary" onClick={onEdit} className="shadow-sm">
                    Edit
                </Button>
                <Button size="sm" variant="destructive" size="icon" onClick={onDelete} className="shadow-sm">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="absolute top-1/2 -left-8 -translate-y-1/2 cursor-grab text-muted-foreground hover:text-primary p-2">
                <GripVertical className="h-6 w-6" />
            </div>

            {/* Preview Card */}
            <div
                className="border rounded-xl bg-card shadow-sm overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                onClick={onEdit}
            >
                <div className="border-b bg-muted/30 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">{blockDef?.label}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{block.id.slice(0, 8)}</span>
                    </div>
                </div>
                <div className="p-0">
                    {/* Render the Mini Preview */}
                    <BlockPreview block={block} />
                </div>
            </div>
        </div>
    );
}

// --- Main Editor Page ---
export default function SiteEditorPage() {
    const router = useRouter();
    const utils = trpc.useUtils();

    // Core Data Fetching
    const { data: company, isLoading: isLoadingCompany } = trpc.company.get.useQuery();

    // Editor State
    const searchParams = useSearchParams();
    const initialPageId = searchParams.get("page") || "home";
    const [pageId, setPageId] = useState(initialPageId); // 'home', 'about', 'services', 'contact', 'service-template'

    const [blocks, setBlocks] = useState<SiteBlock[]>([]);
    const [seo, setSeo] = useState<any>({});

    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [isSeoOpen, setIsSeoOpen] = useState(false);

    // --- 1. Load Data Logic ---
    useEffect(() => {
        if (!company) return;

        const settings = (company.siteSettings as any) || {};
        const pageData = settings.pages?.[pageId] || {};
        setBlocks(pageData.blocks || []);
        setSeo(pageData.seo || { title: "", description: "" });
    }, [company, pageId]);


    // --- 2. Save Logic ---
    const updateCompany = trpc.company.update.useMutation({
        onSuccess: () => {
            toast.success("Page saved successfully");
            utils.company.get.invalidate();
        },
        onError: (err) => toast.error("Error saving: " + err.message)
    });

    const handleSave = () => {
        const currentSettings = (company?.siteSettings as any) || {};
        const newSettings = {
            ...currentSettings,
            pages: {
                ...currentSettings.pages,
                [pageId]: {
                    ...currentSettings.pages?.[pageId],
                    blocks: blocks,
                    seo: seo
                }
            }
        };
        updateCompany.mutate({ siteSettings: newSettings });
    };

    // --- Drag & Drop Handlers (Same as before) ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex(b => b.id === active.id);
                const newIndex = items.findIndex(b => b.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addBlock = (type: BlockType) => {
        const def = BLOCKS[type];
        const newBlock: SiteBlock = {
            id: crypto.randomUUID(),
            type,
            props: { ...def.defaultProps }
        };
        setBlocks(prev => [...prev, newBlock]);
        setEditingBlockId(newBlock.id);
    };

    const updateBlockProps = (id: string, newProps: any) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, props: newProps } : b));
    };

    const deleteBlock = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (editingBlockId === id) setEditingBlockId(null);
    };

    if (isLoadingCompany) return <div className="p-10">Loading editor...</div>;

    const editingBlock = blocks.find(b => b.id === editingBlockId);
    const isLoadingSave = updateCompany.isPending;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="border-b bg-background p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/site")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {/* Page Selector */}
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Editing Page</span>
                            <select
                                className="text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer hover:underline p-0"
                                value={pageId}
                                onChange={(e) => setPageId(e.target.value)}
                            >
                                <optgroup label="Main Pages">
                                    <option value="home">Home</option>
                                    <option value="about">About Us</option>
                                    <option value="services">Services Index</option>
                                    <option value="contact">Contact</option>
                                </optgroup>
                                <optgroup label="Templates">
                                    <option value="service-detail">Service Detail (Template)</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border mx-2" />

                    <Button variant="outline" size="sm" onClick={() => setIsSeoOpen(true)}>
                        SEO Settings
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={isLoadingSave}>
                        {isLoadingSave ? "Saving..." : (
                            <>
                                <Save className="h-4 w-4 mr-2" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Canvas (Centered) */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-3xl mx-auto pl-8">
                    <div className="space-y-6 pb-20">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={blocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {blocks.map((block) => (
                                    <SortableBlockItem
                                        key={block.id}
                                        block={block}
                                        onEdit={() => setEditingBlockId(block.id)}
                                        onDelete={(e) => deleteBlock(e, block.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {blocks.length === 0 && (
                            <div className="text-center py-20 px-4 border-2 border-dashed rounded-xl bg-muted/10">
                                <h3 className="text-lg font-semibold text-muted-foreground">Empty Page</h3>
                                <p className="text-sm text-muted-foreground mt-1">Start adding blocks to build your page.</p>
                            </div>
                        )}

                        {/* Add Block Area */}

                        <div className="border-t pt-8 mt-8">
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block text-center">
                                Add a Block
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(Object.entries(BLOCKS) as [BlockType, any][]).map(([type, def]) => (
                                    <Button
                                        key={type}
                                        variant="outline"
                                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                                        onClick={() => addBlock(type)}
                                    >
                                        <def.icon className="h-6 w-6" />
                                        <span className="font-medium">{def.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Sheet (Slide-over) */}
            <Sheet open={!!editingBlockId} onOpenChange={(open) => !open && setEditingBlockId(null)}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Edit Block</SheetTitle>
                        <SheetDescription>
                            Configure the content and appearance for this section.
                        </SheetDescription>
                    </SheetHeader>

                    {editingBlock && (
                        <div className="space-y-6">
                            <BlockPropsForm
                                block={editingBlock}
                                onChange={updateBlockProps}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* SEO Sheet */}
            <Sheet open={isSeoOpen} onOpenChange={setIsSeoOpen}>
                <SheetContent>
                    <SheetHeader className="mb-6">
                        <SheetTitle>SEO Settings</SheetTitle>
                        <SheetDescription>
                            Optimize this page for search engines and social sharing.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input
                                value={seo.title || ""}
                                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                                placeholder="Page Title | Brand Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                value={seo.description || ""}
                                onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                                rows={4}
                                placeholder="A brief description of this page content..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Social Image (URL)</Label>
                            <Input
                                value={seo.ogImage || ""}
                                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
