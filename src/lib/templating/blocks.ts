import { z } from "zod";
import {
    Layout,
    Type,
    Image as ImageIcon,
    List,
    HelpCircle,
    MessageSquare,
    MapPin,
    Grid
} from "lucide-react";

// --- Hero Block ---
export const HeroBlockSchema = z.object({
    title: z.string().default("Welcome to Our Site"),
    subtitle: z.string().default("We provide excellent services."),
    backgroundImage: z.string().url().optional().or(z.literal("")),
    ctaText: z.string().default("Get Started"),
    ctaLink: z.string().default("/contact"),
    alignment: z.enum(["left", "center", "right"]).default("center"),
});

// --- Features Block ---
export const FeatureItemSchema = z.object({
    title: z.string().default("Feature Name"),
    description: z.string().default("Description of this feature."),
    icon: z.string().optional(), // Lucide icon name or image URL
});

export const FeaturesBlockSchema = z.object({
    title: z.string().default("Our Features"),
    description: z.string().optional(),
    columns: z.number().min(1).max(4).default(3),
    items: z.array(FeatureItemSchema).default([
        { title: "Quality", description: "We ensure top quality." },
        { title: "Speed", description: "Fast delivery guarantees." },
        { title: "Support", description: "24/7 customer support." },
    ]),
});

// --- Content Block ---
export const ContentBlockSchema = z.object({
    title: z.string().optional(),
    content: z.string().default("## Rich Text Content\n\nWrite your content here using Markdown."),
    alignment: z.enum(["left", "center"]).default("left"),
});

// --- Services Grid Block ---
// This block is "smart" - it pulls data automatically, so it has few props
export const ServicesGridBlockSchema = z.object({
    title: z.string().default("Our Services"),
    showPrice: z.boolean().default(true),
    limit: z.number().optional(),
});

// --- FAQ Block ---
export const FAOItemSchema = z.object({
    question: z.string().default("Question?"),
    answer: z.string().default("Answer."),
});

export const FAQBlockSchema = z.object({
    title: z.string().default("Frequently Asked Questions"),
    items: z.array(FAOItemSchema).default([]),
});

// --- Contact Block ---
export const ContactBlockSchema = z.object({
    title: z.string().default("Contact Us"),
    showMap: z.boolean().default(true),
    address: z.string().optional(), // Override company address
    email: z.string().optional(),   // Override company email
    phone: z.string().optional(),   // Override company phone
});

// --- Registry ---

export const BLOCKS = {
    hero: {
        label: "Hero Banner",
        icon: Layout,
        schema: HeroBlockSchema,
        defaultProps: HeroBlockSchema.parse({}),
    },
    features: {
        label: "Features Grid",
        icon: Grid,
        schema: FeaturesBlockSchema,
        defaultProps: FeaturesBlockSchema.parse({}),
    },
    content: {
        label: "Rich Content",
        icon: Type,
        schema: ContentBlockSchema,
        defaultProps: ContentBlockSchema.parse({}),
    },
    services: {
        label: "Services List",
        icon: List,
        schema: ServicesGridBlockSchema,
        defaultProps: ServicesGridBlockSchema.parse({}),
    },
    faq: {
        label: "FAQ Accordion",
        icon: HelpCircle,
        schema: FAQBlockSchema,
        defaultProps: FAQBlockSchema.parse({}),
    },
    contact: {
        label: "Contact Info",
        icon: MapPin,
        schema: ContactBlockSchema,
        defaultProps: ContactBlockSchema.parse({}),
    },
} as const;

export type BlockType = keyof typeof BLOCKS;

export interface SiteBlock {
    id: string; // UUID
    type: BlockType;
    props: Record<string, any>;
}

export interface PageSEO {
    title?: string;
    description?: string;
    keywords?: string; // Comma separated
    ogImage?: string;
}

export interface PageConfig {
    blocks: SiteBlock[];
    seo?: PageSEO;
}
