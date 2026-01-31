"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { RxDropdownMenu } from "react-icons/rx";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { LuCheck, LuType, LuSettings, LuList } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle,
    PropertyOptionsEditor 
} from "@/components/builder/properties";

const type: FormElementType = FormElementType.SELECT;

const extraAttributes = {
    label: "Select Field",
    helperText: "Choose an option",
    showHelperText: false,
    required: false,
    placeholder: "Value here...",
    options: [], // Array of strings
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    showHelperText: z.boolean(),
    required: z.boolean(),
    placeholder: z.string().max(50),
    options: z.array(z.string()),
});

export const SelectFieldFormElement: FormElementHelper = {
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
    label: "Select Field",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, placeholder, helperText, showHelperText, options: rawOptions } = elementInstance.extraAttributes || extraAttributes;
    const options = rawOptions || ["Option 1", "Option 2", "Option 3"];

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <select className="select select-bordered w-full" disabled>
                <option>{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
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

    const { label, required, helperText, showHelperText, placeholder, options: rawOptions } = elementInstance.extraAttributes || extraAttributes;
    const options = rawOptions || [];

    return (
        <div className="flex flex-col gap-4 w-full">
            <label className={`form-field-label text-base md:text-lg font-medium text-[#262627] ${error ? "text-error" : ""}`}>
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>

            <div className="flex flex-col gap-2">
                {options.map((option, index) => {
                    const isSelected = value === option;
                    const keyChar = String.fromCharCode(65 + index); // A, B, C...

                    return (
                        <div
                            key={option}
                            onClick={() => {
                                setValue(option);
                                setError(false);
                                if (submitValue) submitValue(elementInstance.id, option);
                            }}
                            className={`
                                form-field-option flex items-center gap-3 py-2 px-3 rounded-lg border-2 cursor-pointer overflow-hidden transition-all
                                hover:bg-[#0445AF]/5 hover:border-[#0445AF]
                                ${isSelected ? "bg-[#0445AF]/10 border-[#0445AF] ring-1 ring-[#0445AF]" : "bg-white/40 border-[#262627]/20"}
                            `}
                        >
                            <div className={`
                                form-field-option-key w-5 h-5 flex items-center justify-center border-2 rounded text-xs font-semibold
                                ${isSelected ? "bg-[#0445AF] text-white border-[#0445AF]" : "bg-white border-[#262627]/20 text-[#262627]"}
                            `}>
                                {keyChar}
                            </div>
                            <span className="form-field-option-text text-sm md:text-base text-[#262627]">{option}</span>
                            {isSelected && <LuCheck className="ml-auto text-[#0445AF] w-4 h-4" />}
                        </div>
                    );
                })}
            </div>

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
            options: defaults.options,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, showHelperText, required, placeholder, options } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                showHelperText,
                required,
                placeholder,
                options,
            },
        });
    }

    const options = form.watch("options");

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
                    description="Text shown before selection"
                    {...form.register("placeholder")}
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

            <PropertySection title="Options" icon={<LuList className="w-3.5 h-3.5" />} badge={options.length}>
                <PropertyOptionsEditor
                    options={options}
                    onChange={(newOptions) => {
                        form.setValue("options", newOptions);
                        form.handleSubmit(applyChanges)();
                    }}
                    placeholder="Add new option..."
                />
            </PropertySection>

            <PropertySection title="Validation" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Required"
                    description="Users must select an option to submit"
                    {...form.register("required")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>
        </form>
    );
}
