"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef, useCallback } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { LuImage, LuSettings, LuUpload, LuX, LuLink, LuAlignLeft, LuAlignCenter, LuAlignRight, LuExternalLink } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyTextarea,
    PropertySelect,
    PropertyToggle,
} from "@/components/builder/properties";
import { uploadFormFile, deleteFormFile } from "@/actions/storage";
import Image from "next/image";

const type: FormElementType = FormElementType.IMAGE;

// Extended extra attributes with all image properties
const extraAttributes = {
    imageUrl: "",
    altText: "Image",
    caption: "",
    width: "full" as "small" | "medium" | "large" | "full",
    align: "center" as "left" | "center" | "right",
    borderRadius: "md" as "none" | "sm" | "md" | "lg" | "xl" | "full",
    aspectRatio: "auto" as "auto" | "16:9" | "4:3" | "1:1" | "3:2" | "2:3" | "21:9",
    objectFit: "cover" as "cover" | "contain" | "fill",
    shadow: "none" as "none" | "sm" | "md" | "lg" | "xl",
    border: "none" as "none" | "thin" | "medium" | "thick",
    borderColor: "#e5e7eb",
    linkUrl: "",
    linkNewTab: true,
};

const propertiesSchema = z.object({
    imageUrl: z.string().url("Please enter a valid URL").or(z.literal("")),
    altText: z.string().max(200),
    caption: z.string().max(500),
    width: z.enum(["small", "medium", "large", "full"]),
    align: z.enum(["left", "center", "right"]),
    borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]),
    aspectRatio: z.enum(["auto", "16:9", "4:3", "1:1", "3:2", "2:3", "21:9"]),
    objectFit: z.enum(["cover", "contain", "fill"]),
    shadow: z.enum(["none", "sm", "md", "lg", "xl"]),
    border: z.enum(["none", "thin", "medium", "thick"]),
    borderColor: z.string(),
    linkUrl: z.string().url("Please enter a valid URL").or(z.literal("")),
    linkNewTab: z.boolean(),
});

export const ImageFieldFormElement: FormElementHelper = {
    type,
    construct: (id: string) => ({
        id,
        type,
        extraAttributes,
    }),
    designerComponent: DesignerComponent,
    formComponent: FormComponent,
    propertiesComponent: PropertiesComponent,
    // Display-only element - always valid
    validate: (): boolean => true,
    label: "Image",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

const widthStyles = {
    small: "max-w-[200px]",
    medium: "max-w-[400px]",
    large: "max-w-[600px]",
    full: "w-full",
};

const alignStyles = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
};

const borderRadiusStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
};

// Aspect ratio styles (using Tailwind's aspect ratio utilities)
const aspectRatioStyles = {
    "auto": "", // Will use natural image dimensions
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "3:2": "aspect-[3/2]",
    "2:3": "aspect-[2/3]",
    "21:9": "aspect-[21/9]",
};

const objectFitStyles = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
};

const shadowStyles = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
};

const borderStyles = {
    none: "",
    thin: "border",
    medium: "border-2",
    thick: "border-4",
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { 
        imageUrl, 
        altText, 
        caption, 
        width, 
        align, 
        borderRadius,
        aspectRatio,
        objectFit,
        shadow,
        border,
        borderColor,
        linkUrl,
    } = { ...extraAttributes, ...elementInstance.extraAttributes };

    // Build the image container classes
    const imageContainerClasses = [
        "relative overflow-hidden",
        aspectRatio === "auto" ? "aspect-video" : aspectRatioStyles[aspectRatio],
        borderRadiusStyles[borderRadius],
        shadowStyles[shadow],
        borderStyles[border],
    ].filter(Boolean).join(" ");

    return (
        <div className={`flex flex-col gap-2 w-full`}>
            <div className="flex items-center gap-2 mb-1">
                <LuImage className="w-4 h-4 text-primary" />
                <span className="text-xs text-base-content/50">
                    Image{linkUrl && " (linked)"}
                </span>
            </div>
            <div className={`flex ${alignStyles[align]} w-full`}>
                {imageUrl ? (
                    <div className={`${widthStyles[width]} flex flex-col gap-2`}>
                        <div 
                            className={`bg-base-200 ${imageContainerClasses}`}
                            style={{ borderColor: border !== "none" ? borderColor : undefined }}
                        >
                            <Image
                                src={imageUrl}
                                alt={altText}
                                fill
                                className={objectFitStyles[objectFit]}
                                unoptimized
                            />
                        </div>
                        {caption && (
                            <p className="text-xs text-base-content/60 text-center">{caption}</p>
                        )}
                    </div>
                ) : (
                    <div className={`${widthStyles[width]} aspect-video bg-base-200 ${borderRadiusStyles[borderRadius]} flex items-center justify-center border-2 border-dashed border-base-300`}>
                        <div className="flex flex-col items-center gap-2 text-base-content/40">
                            <LuImage className="w-8 h-8" />
                            <span className="text-xs">No image selected</span>
                        </div>
                    </div>
                )}
            </div>
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
    const { 
        imageUrl, 
        altText, 
        caption, 
        width, 
        align, 
        borderRadius,
        aspectRatio,
        objectFit,
        shadow,
        border,
        borderColor,
        linkUrl,
        linkNewTab,
    } = { ...extraAttributes, ...elementInstance.extraAttributes };

    if (!imageUrl) return null;

    // Build the image container classes
    const imageContainerClasses = [
        "relative overflow-hidden",
        aspectRatio === "auto" ? "aspect-video" : aspectRatioStyles[aspectRatio],
        borderRadiusStyles[borderRadius],
        shadowStyles[shadow],
        borderStyles[border],
    ].filter(Boolean).join(" ");

    const imageElement = (
        <figure className={`${widthStyles[width]} flex flex-col gap-2`}>
            <div 
                className={`${imageContainerClasses} ${linkUrl ? "cursor-pointer transition-transform hover:scale-[1.02]" : ""}`}
                style={{ borderColor: border !== "none" ? borderColor : undefined }}
            >
                <Image
                    src={imageUrl}
                    alt={altText}
                    fill
                    className={objectFitStyles[objectFit]}
                    unoptimized
                />
            </div>
            {caption && (
                <figcaption 
                    className="text-sm text-center"
                    style={{ color: "var(--form-text-color, #262627)", opacity: 0.6 }}
                >
                    {caption}
                </figcaption>
            )}
        </figure>
    );

    return (
        <div className={`flex ${alignStyles[align]} w-full`}>
            {linkUrl ? (
                <a 
                    href={linkUrl} 
                    target={linkNewTab ? "_blank" : "_self"}
                    rel={linkNewTab ? "noopener noreferrer" : undefined}
                    className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                    style={{ "--tw-ring-color": "var(--form-primary-color, #6366f1)" } as React.CSSProperties}
                >
                    {imageElement}
                </a>
            ) : (
                imageElement
            )}
        </div>
    );
}

type propertiesFormSchemaType = z.infer<typeof propertiesSchema>;

function PropertiesComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { updateElementById, formId } = useFormBuilder();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaults = { ...extraAttributes, ...elementInstance.extraAttributes };

    const form = useForm<propertiesFormSchemaType>({
        resolver: zodResolver(propertiesSchema),
        mode: "onBlur",
        defaultValues: {
            imageUrl: defaults.imageUrl,
            altText: defaults.altText,
            caption: defaults.caption,
            width: defaults.width,
            align: defaults.align,
            borderRadius: defaults.borderRadius,
            aspectRatio: defaults.aspectRatio,
            objectFit: defaults.objectFit,
            shadow: defaults.shadow,
            border: defaults.border,
            borderColor: defaults.borderColor,
            linkUrl: defaults.linkUrl,
            linkNewTab: defaults.linkNewTab,
        },
    });

    useEffect(() => {
        const newDefaults = { ...extraAttributes, ...elementInstance.extraAttributes };
        form.reset(newDefaults);
    }, [elementInstance.id, elementInstance.extraAttributes, form]);

    const applyChanges = useCallback((values: propertiesFormSchemaType) => {
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: values,
        });
    }, [elementInstance, updateElementById]);

    // Helper to apply changes immediately for select elements
    const handleSelectChange = useCallback((field: keyof propertiesFormSchemaType) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        form.setValue(field, value as any);
        // Apply changes immediately for select elements
        setTimeout(() => {
            applyChanges(form.getValues());
        }, 0);
    }, [form, applyChanges]);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)");
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setUploadError("Image must be less than 5MB");
            return;
        }

        if (!formId) {
            setUploadError("Form not saved yet. Please save the form first.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("formId", formId);
            formData.append("fieldId", elementInstance.id);

            const result = await uploadFormFile(formData);

            if (result.url) {
                form.setValue("imageUrl", result.url);
                applyChanges({ ...form.getValues(), imageUrl: result.url });
            } else {
                setUploadError(result.error || "Failed to upload image");
            }
        } catch {
            setUploadError("Failed to upload image");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    async function handleRemoveImage() {
        const currentUrl = form.getValues("imageUrl");
        
        // If it's a Supabase URL, delete from storage
        if (currentUrl && currentUrl.includes("supabase")) {
            try {
                // Extract path from URL
                const urlParts = currentUrl.split("/form-uploads/");
                if (urlParts[1]) {
                    await deleteFormFile(urlParts[1]);
                }
            } catch (error) {
                console.error("Failed to delete image from storage:", error);
            }
        }

        form.setValue("imageUrl", "");
        applyChanges({ ...form.getValues(), imageUrl: "" });
    }

    const currentImageUrl = form.watch("imageUrl");
    const currentBorder = form.watch("border");

    return (
        <form onBlur={form.handleSubmit(applyChanges)}>
            <PropertySection title="Image Source" icon={<LuImage className="w-3.5 h-3.5" />}>
                {/* Image Preview / Upload Area */}
                {currentImageUrl ? (
                    <div className="space-y-3">
                        <div className="relative aspect-video bg-base-200 rounded-lg overflow-hidden">
                            <Image
                                src={currentImageUrl}
                                alt={form.getValues("altText") || "Preview"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
                            >
                                <LuX className="w-3 h-3" />
                            </button>
                        </div>
                        <p className="text-xs text-base-content/50 truncate">{currentImageUrl}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Toggle between upload and URL */}
                        <div className="tabs tabs-boxed bg-base-200">
                            <button
                                type="button"
                                className={`tab tab-sm flex-1 gap-1 ${inputMode === "upload" ? "tab-active" : ""}`}
                                onClick={() => setInputMode("upload")}
                            >
                                <LuUpload className="w-3 h-3" />
                                Upload
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm flex-1 gap-1 ${inputMode === "url" ? "tab-active" : ""}`}
                                onClick={() => setInputMode("url")}
                            >
                                <LuLink className="w-3 h-3" />
                                URL
                            </button>
                        </div>

                        {inputMode === "upload" ? (
                            <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                className={`aspect-video bg-base-200 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-base-200/80 transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <div className="flex flex-col items-center gap-2 text-base-content/50">
                                    {isUploading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            <span className="text-xs">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LuUpload className="w-6 h-6" />
                                            <span className="text-xs">Click to upload</span>
                                            <span className="text-xs text-base-content/30">Max 5MB</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <PropertyField
                                label="Image URL"
                                description="Enter an image URL"
                                placeholder="https://example.com/image.jpg"
                                {...form.register("imageUrl")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {uploadError && (
                            <p className="text-xs text-error">{uploadError}</p>
                        )}
                    </div>
                )}
            </PropertySection>

            <PropertySection title="Accessibility" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Alt Text"
                    description="Describes the image for screen readers"
                    placeholder="Describe the image"
                    {...form.register("altText")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyTextarea
                    label="Caption"
                    description="Optional caption displayed below the image"
                    placeholder="Add a caption..."
                    {...form.register("caption")}
                />
            </PropertySection>

            <PropertySection title="Size & Layout" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertySelect
                    label="Width"
                    description="Maximum width of the image"
                    value={form.watch("width")}
                    onChange={handleSelectChange("width")}
                    options={[
                        { value: "small", label: "Small (200px)" },
                        { value: "medium", label: "Medium (400px)" },
                        { value: "large", label: "Large (600px)" },
                        { value: "full", label: "Full Width" },
                    ]}
                />

                <PropertySelect
                    label="Aspect Ratio"
                    description="Shape of the image container"
                    value={form.watch("aspectRatio")}
                    onChange={handleSelectChange("aspectRatio")}
                    options={[
                        { value: "auto", label: "Auto (16:9 default)" },
                        { value: "16:9", label: "Widescreen (16:9)" },
                        { value: "4:3", label: "Standard (4:3)" },
                        { value: "1:1", label: "Square (1:1)" },
                        { value: "3:2", label: "Photo (3:2)" },
                        { value: "2:3", label: "Portrait (2:3)" },
                        { value: "21:9", label: "Ultra-wide (21:9)" },
                    ]}
                />

                <PropertySelect
                    label="Image Fit"
                    description="How the image fills the container"
                    value={form.watch("objectFit")}
                    onChange={handleSelectChange("objectFit")}
                    options={[
                        { value: "cover", label: "Cover (fill, may crop)" },
                        { value: "contain", label: "Contain (show all)" },
                        { value: "fill", label: "Stretch to fill" },
                    ]}
                />

                <div className="form-control">
                    <label className="label">
                        <span className="label-text text-sm font-medium text-base-content/80">Alignment</span>
                    </label>
                    <div className="flex gap-1">
                        {[
                            { value: "left", icon: LuAlignLeft, label: "Left" },
                            { value: "center", icon: LuAlignCenter, label: "Center" },
                            { value: "right", icon: LuAlignRight, label: "Right" },
                        ].map(({ value, icon: Icon, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    form.setValue("align", value as "left" | "center" | "right");
                                    applyChanges({ ...form.getValues(), align: value as "left" | "center" | "right" });
                                }}
                                className={`btn btn-sm flex-1 ${form.watch("align") === value ? "btn-primary" : "btn-ghost"}`}
                                title={label}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </div>
            </PropertySection>

            <PropertySection title="Styling" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertySelect
                    label="Border Radius"
                    description="Corner roundness"
                    value={form.watch("borderRadius")}
                    onChange={handleSelectChange("borderRadius")}
                    options={[
                        { value: "none", label: "None (Sharp corners)" },
                        { value: "sm", label: "Small" },
                        { value: "md", label: "Medium" },
                        { value: "lg", label: "Large" },
                        { value: "xl", label: "Extra Large" },
                        { value: "full", label: "Full (Circle/Pill)" },
                    ]}
                />

                <PropertySelect
                    label="Shadow"
                    description="Drop shadow effect"
                    value={form.watch("shadow")}
                    onChange={handleSelectChange("shadow")}
                    options={[
                        { value: "none", label: "None" },
                        { value: "sm", label: "Small" },
                        { value: "md", label: "Medium" },
                        { value: "lg", label: "Large" },
                        { value: "xl", label: "Extra Large" },
                    ]}
                />

                <PropertySelect
                    label="Border"
                    description="Border around the image"
                    value={form.watch("border")}
                    onChange={handleSelectChange("border")}
                    options={[
                        { value: "none", label: "None" },
                        { value: "thin", label: "Thin (1px)" },
                        { value: "medium", label: "Medium (2px)" },
                        { value: "thick", label: "Thick (4px)" },
                    ]}
                />

                {currentBorder !== "none" && (
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-base-content/80">Border Color</span>
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={form.watch("borderColor")}
                                onChange={(e) => {
                                    form.setValue("borderColor", e.target.value);
                                    applyChanges({ ...form.getValues(), borderColor: e.target.value });
                                }}
                                className="w-10 h-10 rounded-lg border border-base-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={form.watch("borderColor")}
                                onChange={(e) => {
                                    form.setValue("borderColor", e.target.value);
                                }}
                                onBlur={() => {
                                    applyChanges(form.getValues());
                                }}
                                className="input input-sm input-bordered flex-1 font-mono"
                                placeholder="#e5e7eb"
                            />
                        </div>
                    </div>
                )}
            </PropertySection>

            <PropertySection title="Link" icon={<LuExternalLink className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Link URL"
                    description="Make the image clickable"
                    placeholder="https://example.com"
                    {...form.register("linkUrl")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                {form.watch("linkUrl") && (
                    <PropertyToggle
                        label="Open in new tab"
                        description="Opens link in a new browser tab"
                        {...form.register("linkNewTab")}
                        onToggleChange={() => form.handleSubmit(applyChanges)()}
                    />
                )}
            </PropertySection>
        </form>
    );
}
