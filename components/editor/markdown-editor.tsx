"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Toggle } from "@/components/ui/toggle";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Strikethrough,
    Link as LinkIcon,
} from "lucide-react";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function MarkdownEditor({
    value,
    onChange,
    placeholder,
    disabled,
}: MarkdownEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-500 hover:underline",
                },
            }),
        ],
        content: value, // Initial content
        editable: !disabled,
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
            },
        },
        onUpdate: ({ editor }) => {
            // Get HTML content
            const html = editor.getHTML();
            onChange(html);
        },
    });

    // START FIX: Update editor content when value prop changes (e.g. from DB load)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Only update if content is actually different to avoid cursor jumps/loops
            // Check strictly or allows some normalization? HTML comparison is tricky.
            // For simple cases, let's try to set it if it's completely different or empty.
            // Better strategy: only set if editor is empty acting as "initial load" or if we accept external changes
            // For this specific bug (loading data), value changes from "" to "content".

            // If editor is effectively empty and value is provided, set it.
            if (editor.isEmpty && value) {
                editor.commands.setContent(value);
                return;
            }

            // Fallback for non-empty external updates (less common in this form but possible)
            // We'll trust the value prop if it differs significantly, but this might cause cursor jumps if user is typing
            // and we get a race.
            // Given the use case (form load), checking for mismatch is safet.

            const currentContent = editor.getHTML();
            if (currentContent !== value) {
                // To avoid loop on local typing:
                // Only update if the value likely comes from external source (not just the onChange we just emitted).
                // But here we can't easily distinguish.
                // However, for the "loading" bug, the key is that `value` updates from parent while editor is displayed.
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);
    // END FIX

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
        <div className="border rounded-md bg-transparent">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b p-1 bg-muted/40">
                <Toggle
                    size="sm"
                    pressed={editor.isActive("bold")}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    aria-label="Toggle strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    aria-label="Toggle H2"
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    aria-label="Toggle H3"
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive("bulletList")}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Toggle bullet list"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("orderedList")}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Toggle ordered list"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive("blockquote")}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Toggle quote"
                >
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("link")}
                    onPressedChange={setLink}
                    aria-label="Toggle link"
                >
                    <LinkIcon className="h-4 w-4" />
                </Toggle>
            </div>

            {/* Editor Area */}
            <div className="min-h-[150px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
