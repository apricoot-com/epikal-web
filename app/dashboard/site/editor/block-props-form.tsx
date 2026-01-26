"use client";

import { SiteBlock, BLOCKS } from "@/src/lib/templating/blocks";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { z } from "zod";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BlockPropsFormProps {
    block: SiteBlock;
    onChange: (id: string, newProps: any) => void;
}

// Helper to unwrap ZodOptional / ZodDefault / ZodNullable / ZodUnion
const unwrapZodType = (zodType: any): any => {
    if (!zodType || !zodType._def) return zodType;

    const typeName = zodType._def.typeName || zodType.constructor.name;

    if (typeName === "ZodOptional" || typeName === "ZodNullable") {
        return unwrapZodType(zodType._def.innerType);
    }
    if (typeName === "ZodDefault") {
        return unwrapZodType(zodType._def.innerType);
    }
    if (typeName === "ZodUnion") {
        const options = zodType._def.options;
        const stringOption = options.find((opt: any) => {
            const unwrapped = unwrapZodType(opt);
            const tName = unwrapped?._def?.typeName || unwrapped?.constructor?.name;
            return tName === "ZodString";
        });
        if (stringOption) return unwrapZodType(stringOption);
        return unwrapZodType(options[0]);
    }
    if (typeName === "ZodEffects") {
        return unwrapZodType(zodType._def.schema);
    }
    return zodType;
};

export function BlockPropsForm({ block, onChange }: BlockPropsFormProps) {
    const blockDef = BLOCKS[block.type];

    if (!blockDef) return <div>Unknown block type</div>;

    const schemaShape = (blockDef.schema as any).shape;

    const renderField = (key: string, originalZodType: any) => {
        const zodType = unwrapZodType(originalZodType);
        const typeName = zodType?._def?.typeName || zodType?.constructor?.name;
        const value = block.props[key] ?? "";

        const handleInjectVariable = (variable: string) => {
            if (typeName === "ZodArray") {
                // For arrays, we assume the user wants to replace the whole content with the variable
                onChange(block.id, { ...block.props, [key]: variable });
            } else {
                onChange(block.id, { ...block.props, [key]: value + variable });
            }
        };

        const renderLabelWithVariables = () => (
            <div className="flex justify-between items-center">
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                {/* Dynamic Variable Helper - Dropdown */}
                {(typeName === "ZodString" || typeName === "ZodArray") && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1">
                                <Plus className="h-3 w-3" /> Insert Variable
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Available Variables</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['${company.name}', '${company.phone}', '${company.email}', '${company.address}', '${service.name}', '${service.shortDescription}', '${service.longDescription}', '${service.image}', '${service.faqs}', '${service.price}', '${service.duration}'].map(v => (
                                <DropdownMenuItem key={v} onClick={() => handleInjectVariable(v)}>
                                    <span className="font-mono text-xs">{v}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        );

        if (typeName === "ZodString") {
            const isImage = key.toLowerCase().includes('image') ||
                key.toLowerCase().includes('logo') ||
                key.toLowerCase().includes('icon') ||
                key.toLowerCase().includes('avatar');

            if (isImage) {
                return (
                    <div key={key} className="space-y-2">
                        {renderLabelWithVariables()}
                        <ImageUpload
                            value={value}
                            onChange={(url) => onChange(block.id, { ...block.props, [key]: url })}
                            onRemove={() => onChange(block.id, { ...block.props, [key]: "" })}
                            folder="templates"
                        />
                    </div>
                );
            }

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

        if (typeName === "ZodBoolean") {
            return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Switch
                        checked={!!value}
                        onCheckedChange={(checked: boolean) => onChange(block.id, { ...block.props, [key]: checked })}
                    />
                </div>
            );
        }

        if (typeName === "ZodNumber") {
            return (
                <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(block.id, { ...block.props, [key]: parseFloat(e.target.value) })}
                    />
                </div>
            );
        }

        // Enum (ZodEnum)
        if (typeName === "ZodEnum") {
            const options = zodType._def?.values || (zodType.enum ? Object.keys(zodType.enum) : []) || [];
            return (
                <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={value}
                        onChange={(e) => onChange(block.id, { ...block.props, [key]: e.target.value })}
                    >
                        {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (typeName === "ZodArray") {
            return (
                <div key={key} className="space-y-2">
                    {renderLabelWithVariables()}
                    <Textarea
                        className="font-mono text-xs bg-muted/20"
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                onChange(block.id, { ...block.props, [key]: parsed });
                            } catch (err) {
                                // If value is a simple string (variable), pass it through
                                // This allows saving "${service.faqs}" as a string instead of array
                                if (e.target.value.startsWith("${")) {
                                    onChange(block.id, { ...block.props, [key]: e.target.value });
                                }
                            }
                        }}
                        rows={10}
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Edita este campo como una lista JSON o inserta una variable (ej. <code>{`\${service.faqs}`}</code>).
                    </p>
                </div>
            );
        }

        return (
            <div key={key} className="p-4 border border-amber-500/50 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs break-all">
                <strong>Unknown Field Type:</strong> {key} ({typeName})
                <br />
                CType: {zodType?.constructor?.name}
                <br />
                Keys: {Object.keys(zodType?._def || {}).join(', ')}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {Object.entries(schemaShape).map(([key, schema]) => renderField(key, schema))}
        </div>
    );
}
