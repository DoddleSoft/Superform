"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { MdCheckBox } from "react-icons/md";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { LuCheck, LuType, LuSettings, LuList } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle,
    PropertyOptionsEditor 
} from "@/components/builder/properties";

const type: FormElementType = FormElementType.CHECKBOX_GROUP;

const extraAttributes = {
    label: "Multiple Choice",
    helperText: "Select all that apply",
    showHelperText: false,
    required: false,
    minSelect: 0,
    maxSelect: 0, // 0 means no limit
    options: ["Option 1", "Option 2", "Option 3"],
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    showHelperText: z.boolean(),
    required: z.boolean(),
    minSelect: z.number().min(0),
    maxSelect: z.number().min(0),
    options: z.array(z.string()).min(1),
});

export const CheckboxGroupFormElement: FormElementHelper = {
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
        const { required, minSelect, maxSelect } = element.extraAttributes || extraAttributes;
        
        // Parse JSON array from value
        let selectedValues: string[] = [];
        try {
            selectedValues = currentValue ? JSON.parse(currentValue) : [];
        } catch {
            selectedValues = [];
        }
        
        if (required && selectedValues.length === 0) {
            return false;
        }
        if (minSelect > 0 && selectedValues.length < minSelect) {
            return false;
        }
        if (maxSelect > 0 && selectedValues.length > maxSelect) {
            return false;
        }
        return true;
    },
    label: "Multiple Choice",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, showHelperText, options } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text flex items-center gap-2">
                <MdCheckBox className="w-4 h-4 text-primary" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-col gap-2">
                {options.slice(0, 3).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" disabled />
                        <span className="text-sm">{option}</span>
                    </div>
                ))}
                {options.length > 3 && (
                    <span className="text-xs text-base-content/50">+{options.length - 3} more options</span>
                )}
            </div>
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
    const [selectedValues, setSelectedValues] = useState<string[]>(() => {
        try {
            return defaultValue ? JSON.parse(defaultValue) : [];
        } catch {
            return [];
        }
    });
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, helperText, showHelperText, options, minSelect, maxSelect } = elementInstance.extraAttributes || extraAttributes;

    const toggleOption = (option: string) => {
        let newValues: string[];
        if (selectedValues.includes(option)) {
            newValues = selectedValues.filter(v => v !== option);
        } else {
            // Check max limit
            if (maxSelect > 0 && selectedValues.length >= maxSelect) {
                return; // Don't add more if at max
            }
            newValues = [...selectedValues, option];
        }
        
        setSelectedValues(newValues);
        const jsonValue = JSON.stringify(newValues);
        
        if (submitValue) {
            const valid = CheckboxGroupFormElement.validate(elementInstance, jsonValue);
            setError(!valid);
            submitValue(elementInstance.id, jsonValue);
        }
    };

    // Generate helper text with selection info
    let selectionHint = "";
    if (minSelect > 0 && maxSelect > 0) {
        selectionHint = `Select ${minSelect} to ${maxSelect} options`;
    } else if (minSelect > 0) {
        selectionHint = `Select at least ${minSelect} option${minSelect > 1 ? 's' : ''}`;
    } else if (maxSelect > 0) {
        selectionHint = `Select up to ${maxSelect} option${maxSelect > 1 ? 's' : ''}`;
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <label className={`form-field-label text-base md:text-lg font-medium text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <MdCheckBox className="form-field-icon w-5 h-5" />
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>

            <div className="flex flex-col gap-2">
                {options.map((option, index) => {
                    const isSelected = selectedValues.includes(option);
                    const keyChar = String.fromCharCode(65 + index); // A, B, C...
                    const isDisabled = maxSelect > 0 && selectedValues.length >= maxSelect && !isSelected;

                    return (
                        <div
                            key={option}
                            onClick={() => !isDisabled && toggleOption(option)}
                            className={`
                                form-field-option flex items-center gap-3 py-2.5 px-3 rounded-lg border-2 overflow-hidden transition-all
                                ${isDisabled 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "cursor-pointer hover:bg-[#0445AF]/5 hover:border-[#0445AF]"}
                                ${isSelected 
                                    ? "bg-[#0445AF]/10 border-[#0445AF] ring-1 ring-[#0445AF]" 
                                    : "bg-white/40 border-[#262627]/20"}
                                ${error ? "border-error" : ""}
                            `}
                        >
                            <div className={`
                                form-field-option-key w-5 h-5 flex items-center justify-center border-2 rounded text-xs font-semibold transition-all
                                ${isSelected 
                                    ? "bg-[#0445AF] text-white border-[#0445AF]" 
                                    : "bg-white border-[#262627]/20 text-[#262627]"}
                            `}>
                                {isSelected ? <LuCheck className="w-3 h-3" /> : keyChar}
                            </div>
                            <span className="form-field-option-text text-sm md:text-base text-[#262627]">{option}</span>
                        </div>
                    );
                })}
            </div>

            {selectionHint && (
                <p className="form-field-helper text-xs text-[#262627]/50">{selectionHint}</p>
            )}
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
            minSelect: defaults.minSelect,
            maxSelect: defaults.maxSelect,
            options: defaults.options,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options" as never,
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, showHelperText, required, minSelect, maxSelect, options } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                showHelperText,
                required,
                minSelect,
                maxSelect,
                options,
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

            <PropertySection title="Options" icon={<LuList className="w-3.5 h-3.5" />}>
                <PropertyOptionsEditor
                    options={form.watch("options") || []}
                    onChange={(options) => {
                        form.setValue("options", options);
                        form.handleSubmit(applyChanges)();
                    }}
                />
            </PropertySection>

            <PropertySection title="Selection Limits" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <div className="grid grid-cols-2 gap-4">
                    <PropertyField
                        label="Min Select"
                        description="0 = no minimum"
                        type="number"
                        min={0}
                        {...form.register("minSelect", { valueAsNumber: true })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                    <PropertyField
                        label="Max Select"
                        description="0 = no limit"
                        type="number"
                        min={0}
                        {...form.register("maxSelect", { valueAsNumber: true })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                </div>
            </PropertySection>

            <PropertySection title="Validation" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Required"
                    description="Users must select at least one option to submit"
                    {...form.register("required")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>
        </form>
    );
}
