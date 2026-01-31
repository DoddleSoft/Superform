"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { LuHeading, LuType, LuSettings } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyTextarea,
    PropertySelect 
} from "@/components/builder/properties";

const type: FormElementType = FormElementType.HEADING;

const extraAttributes = {
    title: "Heading",
    subtitle: "",
    level: "h2" as "h1" | "h2" | "h3" | "h4",
    align: "left" as "left" | "center" | "right",
};

const propertiesSchema = z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().max(500),
    level: z.enum(["h1", "h2", "h3", "h4"]),
    align: z.enum(["left", "center", "right"]),
});

export const HeadingFieldFormElement: FormElementHelper = {
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
    label: "Heading",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

const headingStyles = {
    h1: "text-2xl md:text-3xl font-bold",
    h2: "text-xl md:text-2xl font-semibold",
    h3: "text-lg md:text-xl font-medium",
    h4: "text-base md:text-lg font-medium",
};

const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { title, subtitle, level, align } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className={`flex flex-col gap-1 w-full ${alignStyles[align]}`}>
            <div className="flex items-center gap-2 mb-1">
                <LuHeading className="w-4 h-4 text-primary" />
                <span className="text-xs text-base-content/50">{level.toUpperCase()}</span>
            </div>
            <div className={`text-base-content font-semibold ${level === "h1" ? "text-xl" : level === "h2" ? "text-lg" : "text-base"}`}>
                {title}
            </div>
            {subtitle && (
                <p className="text-sm text-base-content/70">{subtitle}</p>
            )}
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
    const { title, subtitle, level, align } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className={`flex flex-col gap-2 w-full ${alignStyles[align]}`}>
            {level === "h1" && <h1 className={`form-section-title text-[#262627] ${headingStyles.h1}`}>{title}</h1>}
            {level === "h2" && <h2 className={`form-section-title text-[#262627] ${headingStyles.h2}`}>{title}</h2>}
            {level === "h3" && <h3 className={`form-section-title text-[#262627] ${headingStyles.h3}`}>{title}</h3>}
            {level === "h4" && <h4 className={`form-section-title text-[#262627] ${headingStyles.h4}`}>{title}</h4>}
            {subtitle && (
                <p className="form-section-description text-sm md:text-base text-[#262627]/70">{subtitle}</p>
            )}
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
            title: defaults.title,
            subtitle: defaults.subtitle,
            level: defaults.level,
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

    return (
        <form onBlur={form.handleSubmit(applyChanges)}>
            <PropertySection title="Content" icon={<LuType className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Title"
                    description="The main heading text"
                    {...form.register("title")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyTextarea
                    label="Subtitle"
                    description="Optional text below the heading"
                    rows={2}
                    {...form.register("subtitle")}
                />
            </PropertySection>

            <PropertySection title="Appearance" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertySelect
                    label="Heading Level"
                    description="Controls the size and importance"
                    options={[
                        { value: "h1", label: "H1 - Largest" },
                        { value: "h2", label: "H2 - Large" },
                        { value: "h3", label: "H3 - Medium" },
                        { value: "h4", label: "H4 - Small" },
                    ]}
                    {...form.register("level")}
                />

                <PropertySelect
                    label="Text Alignment"
                    options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                    ]}
                    {...form.register("align")}
                />
            </PropertySection>
        </form>
    );
}
