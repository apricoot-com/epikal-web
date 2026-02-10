"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SiteBlock, BLOCKS } from "@/src/lib/templating/blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical } from "lucide-react";
import { BlockPreview } from "./block-preview";

interface SortableBlockItemProps {
    block: SiteBlock;
    onEdit: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function SortableBlockItem({
    block,
    onEdit,
    onDelete
}: SortableBlockItemProps) {
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
                <Button variant="destructive" size="icon" onClick={onDelete} className="shadow-sm">
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
