"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { LuFileText } from "react-icons/lu";

const type: FormElementType = FormElementType.RICH_TEXT;

const extraAttributes = {
    content: "Add your content here. You can use **bold**, *italic*, and other markdown formatting.",
    align: "left" as "left" | "center" | "right",
};

const propertiesSchema = z.object({
    content: z.string().min(1).max(5000),
    align: z.enum(["left", "center", "right"]),
});

export const RichTextFieldFormElement: FormElementHelper = {
    type,
    construct: (id: string) => ({
        id,
        type,
        extraAttributes,
    }),
    designerComponent: DesignerComponent,
    formComponent: FormComponent,
    propertiesComponent: PropertiesComponent,
    // Read-only element - always valid
    validate: (): boolean => true,
    label: "Rich Text",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): string {
    return text
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Links: [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#0445AF] underline hover:no-underline">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br />');
}

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { content, align } = elementInstance.extraAttributes || extraAttributes;

    // Preview first 100 characters
    const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;

    return (
        <div className={`flex flex-col gap-2 w-full ${alignStyles[align]}`}>
            <div className="flex items-center gap-2 mb-1">
                <LuFileText className="w-4 h-4 text-primary" />
                <span className="text-xs text-base-content/50">Rich Text</span>
            </div>
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">{preview}</p>
        </div>
    );
}

function FormComponent({
    element,
}: {
    element: FormElementInstance;
    submitValue?: (key: string, value: string) => void;
    isInvalid?: boolean;
    defaultValue?: string;
}) {
    const elementInstance = element as CustomInstance;
    const { content, align } = elementInstance.extraAttributes || extraAttributes;

    const htmlContent = parseMarkdown(content);

    return (
        <div className={`flex flex-col gap-2 w-full ${alignStyles[align]}`}>
            <div 
                className="form-field-helper text-lg text-[#262627]/80 leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}

type propertiesFormSchemaType = z.infer<typeof propertiesSchema>;

function PropertiesComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { updateElementById } = useFormBuilder();

    const defaults = elementInstance.extraAttributes || extraAttributes;

    const form = useForm<propertiesFormSchemaType>({
        resolver: zodResolver(propertiesSchema),
        mode: "onBlur",
        defaultValues: {
            content: defaults.content,
            align: defaults.align,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: values,
        });
    }

    const watchContent = form.watch("content");
    const previewHtml = parseMarkdown(watchContent || "");

    return (
        <form
            onBlur={form.handleSubmit(applyChanges)}
            className="flex flex-col gap-4"
        >
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Content</span>
                </label>
                <textarea
                    className="textarea textarea-bordered w-full font-mono text-sm"
                    rows={8}
                    placeholder="Write your content here. Supports markdown..."
                    {...form.register("content")}
                />
                <label className="label">
                    <span className="label-text-alt">
                        Supports **bold**, *italic*, [links](url)
                    </span>
                </label>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Preview</span>
                </label>
                <div 
                    className="p-3 bg-base-200 rounded-lg text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Text Alignment</span>
                </label>
                <select
                    className="select select-bordered w-full"
                    {...form.register("align")}
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </form>
    );
}
