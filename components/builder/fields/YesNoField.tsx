"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { LuCheck, LuX, LuType, LuSettings, LuPenLine } from "react-icons/lu";
import { BsToggleOn } from "react-icons/bs";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle 
} from "@/components/builder/properties";

const type: FormElementType = FormElementType.YES_NO;

const extraAttributes = {
    label: "Yes / No",
    helperText: "",
    required: false,
    yesLabel: "Yes",
    noLabel: "No",
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(100),
    helperText: z.string().max(200),
    required: z.boolean(),
    yesLabel: z.string().min(1).max(20),
    noLabel: z.string().min(1).max(20),
});

export const YesNoFieldFormElement: FormElementHelper = {
    type,
    construct: (id: string) => ({
        id,
        type,
        extraAttributes,
    }),
    designerComponent: DesignerComponent,
    formComponent: FormComponent,
    propertiesComponent: PropertiesComponent,
    validate: (formElement: FormElementInstance, currentValue: string): boolean => {
        const element = formElement as CustomInstance;
        if (element.extraAttributes?.required) {
            return currentValue === "yes" || currentValue === "no";
        }
        return true;
    },
    label: "Yes / No",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, yesLabel, noLabel } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text flex items-center gap-2">
                <BsToggleOn className="w-4 h-4 text-primary" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <div className="btn btn-sm btn-outline gap-1">
                    <LuCheck className="w-3 h-3" />
                    {yesLabel}
                </div>
                <div className="btn btn-sm btn-outline gap-1">
                    <LuX className="w-3 h-3" />
                    {noLabel}
                </div>
            </div>
            {helperText && (
                <p className="text-[0.8rem] text-base-content/70">{helperText}</p>
            )}
        </div>
    );
}

function FormComponent({
    element,
    submitValue,
    isInvalid,
    defaultValue,
}: {
    element: FormElementInstance;
    submitValue?: (key: string, value: string) => void;
    isInvalid?: boolean;
    defaultValue?: string;
}) {
    const elementInstance = element as CustomInstance;
    const [value, setValue] = useState<"yes" | "no" | "">(
        defaultValue === "yes" || defaultValue === "no" ? defaultValue : ""
    );
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, helperText, yesLabel, noLabel } = elementInstance.extraAttributes || extraAttributes;

    const handleSelect = (selection: "yes" | "no") => {
        setValue(selection);
        setError(false);
        if (submitValue) {
            submitValue(elementInstance.id, selection);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <label className={`form-field-label text-xl md:text-2xl font-normal text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <BsToggleOn className="form-field-icon w-6 h-6" />
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => handleSelect("yes")}
                    className={`
                        form-yesno-btn flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 text-lg font-medium
                        transition-all focus:outline-none focus:ring-2 focus:ring-[#0445AF]/50
                        ${value === "yes" 
                            ? "bg-green-500 text-white border-green-500 shadow-lg" 
                            : "bg-white/40 text-[#262627] border-[#262627]/30 hover:border-green-500 hover:bg-green-50"}
                        ${error ? "border-error" : ""}
                    `}
                >
                    <LuCheck className={`form-yesno-icon w-6 h-6 ${value === "yes" ? "text-white" : "text-green-500"}`} />
                    {yesLabel}
                </button>

                <button
                    type="button"
                    onClick={() => handleSelect("no")}
                    className={`
                        form-yesno-btn flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 text-lg font-medium
                        transition-all focus:outline-none focus:ring-2 focus:ring-[#0445AF]/50
                        ${value === "no" 
                            ? "bg-red-500 text-white border-red-500 shadow-lg" 
                            : "bg-white/40 text-[#262627] border-[#262627]/30 hover:border-red-500 hover:bg-red-50"}
                        ${error ? "border-error" : ""}
                    `}
                >
                    <LuX className={`form-yesno-icon w-6 h-6 ${value === "no" ? "text-white" : "text-red-500"}`} />
                    {noLabel}
                </button>
            </div>

            {helperText && (
                <p className={`form-field-helper text-lg text-[#262627]/60 ${error && "text-error"}`}>
                    {helperText}
                </p>
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
            label: defaults.label,
            helperText: defaults.helperText,
            required: defaults.required,
            yesLabel: defaults.yesLabel,
            noLabel: defaults.noLabel,
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
                    label="Label / Question"
                    description="The question shown to users"
                    {...form.register("label")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="Helper Text"
                    description="Additional guidance text"
                    {...form.register("helperText")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
            </PropertySection>

            <PropertySection title="Button Labels" icon={<LuPenLine className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Yes Label"
                    description="Text for the 'Yes' button"
                    {...form.register("yesLabel")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="No Label"
                    description="Text for the 'No' button"
                    {...form.register("noLabel")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
            </PropertySection>

            <PropertySection title="Validation" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Required"
                    description="Users must select an option to submit"
                    {...form.register("required")}
                />
            </PropertySection>
        </form>
    );
}
