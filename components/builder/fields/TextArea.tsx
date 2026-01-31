"use client";

import { FormElementInstance, FormElementType, FormElementHelper } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BsTextParagraph } from "react-icons/bs";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle 
} from "@/components/builder/properties";
import { LuType, LuSettings } from "react-icons/lu";

const type: FormElementType = FormElementType.TEXTAREA;

const extraAttributes = {
    label: "Text Area",
    helperText: "Helper text",
    showHelperText: false,
    required: false,
    placeholder: "Value here...",
    rows: 3,
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    showHelperText: z.boolean(),
    required: z.boolean(),
    placeholder: z.string().max(50),
    rows: z.number().min(1).max(50),
});

export const TextAreaFormElement: FormElementHelper = {
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
            return currentValue.length > 0;
        }

        return true;
    },
    label: "Text Area",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, placeholder, helperText, showHelperText, rows } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                readOnly
                disabled
                className="textarea textarea-bordered w-full"
                placeholder={placeholder}
                rows={rows}
            />
            {showHelperText && helperText && (
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

    const [value, setValue] = useState(defaultValue || "");
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, placeholder, helperText, showHelperText, rows } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-3 w-full">
            <label className={`form-field-label text-base md:text-lg font-medium text-[#262627] ${error ? "text-error" : ""}`}>
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <textarea
                className={`form-field-input w-full bg-transparent border-2 border-[#262627]/20 rounded-lg text-base md:text-lg p-3 focus:outline-none focus:border-[#0445AF] transition-colors placeholder:text-[#262627]/40 resize-none ${error ? "border-error" : ""}`}
                placeholder={placeholder}
                rows={rows}
                onChange={(e) => {
                    setValue(e.target.value);
                    if (!submitValue) return;
                    const valid = TextAreaFormElement.validate(elementInstance, e.target.value);
                    setError(!valid);
                    submitValue(elementInstance.id, e.target.value);
                }}
                onBlur={(e) => {
                    if (!submitValue) return;
                    const valid = TextAreaFormElement.validate(elementInstance, e.target.value);
                    setError(!valid);
                    submitValue(elementInstance.id, e.target.value);
                }}
                value={value}
            />
            {showHelperText && helperText && (
                <p className={`form-field-helper text-sm text-[#262627]/60 ${error && "text-error"}`}>
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
            showHelperText: defaults.showHelperText,
            required: defaults.required,
            placeholder: defaults.placeholder,
            rows: defaults.rows,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, showHelperText, required, placeholder, rows } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                showHelperText,
                required,
                placeholder,
                rows,
            },
        });
    }

    return (
        <form onBlur={form.handleSubmit(applyChanges)}>
            <PropertySection title="Content" icon={<LuType className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Label"
                    description="The question or prompt shown to users"
                    {...form.register("label")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="Placeholder"
                    description="Example text shown when empty"
                    {...form.register("placeholder")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="Rows"
                    type="number"
                    description="Number of visible text rows"
                    {...form.register("rows", { valueAsNumber: true })}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="Helper Text"
                    description="Additional guidance below the field"
                    {...form.register("helperText")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyToggle
                    label="Show Helper Text"
                    description="Display the helper text below the field"
                    {...form.register("showHelperText")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>

            <PropertySection title="Validation" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Required"
                    description="Users must fill this field to submit"
                    {...form.register("required")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>
        </form>
    );
}
