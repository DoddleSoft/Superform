"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { MdCheckBox } from "react-icons/md";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { LuCheck } from "react-icons/lu";

const type: FormElementType = FormElementType.CHECKBOX_GROUP;

const extraAttributes = {
    label: "Multiple Choice",
    helperText: "Select all that apply",
    required: false,
    minSelect: 0,
    maxSelect: 0, // 0 means no limit
    options: ["Option 1", "Option 2", "Option 3"],
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
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
    const { label, required, helperText, options } = elementInstance.extraAttributes || extraAttributes;

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

    const { label, required, helperText, options, minSelect, maxSelect } = elementInstance.extraAttributes || extraAttributes;

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
            <label className={`text-xl md:text-2xl font-normal text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <MdCheckBox className="w-6 h-6" />
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
                                flex items-center gap-3 p-3 rounded-lg border overflow-hidden transition-all
                                ${isDisabled 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "cursor-pointer hover:bg-[#0445AF]/5 hover:border-[#0445AF]"}
                                ${isSelected 
                                    ? "bg-[#0445AF]/10 border-[#0445AF] ring-1 ring-[#0445AF]" 
                                    : "bg-white/40 border-[#262627]/30"}
                                ${error ? "border-error" : ""}
                            `}
                        >
                            <div className={`
                                w-7 h-7 flex items-center justify-center border rounded text-sm font-semibold transition-all
                                ${isSelected 
                                    ? "bg-[#0445AF] text-white border-[#0445AF]" 
                                    : "bg-white border-[#262627]/30 text-[#262627]"}
                            `}>
                                {isSelected ? <LuCheck className="w-4 h-4" /> : keyChar}
                            </div>
                            <span className="text-lg text-[#262627]">{option}</span>
                        </div>
                    );
                })}
            </div>

            {selectionHint && (
                <p className="text-base text-[#262627]/50">{selectionHint}</p>
            )}
            {helperText && (
                <p className={`text-lg text-[#262627]/60 ${error && "text-error"}`}>
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
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: values,
        });
    }

    return (
        <form
            onBlur={form.handleSubmit(applyChanges)}
            className="flex flex-col gap-4"
        >
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Label</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    {...form.register("label")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Helper Text</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    {...form.register("helperText")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Options</span>
                </label>
                <div className="flex flex-col gap-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <input
                                type="text"
                                className="input input-bordered input-sm flex-1"
                                {...form.register(`options.${index}`)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") e.currentTarget.blur();
                                }}
                            />
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-square"
                                onClick={() => {
                                    if (fields.length > 1) {
                                        remove(index);
                                        form.handleSubmit(applyChanges)();
                                    }
                                }}
                            >
                                <AiOutlineClose className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn-outline btn-sm gap-2"
                        onClick={() => {
                            append(`Option ${fields.length + 1}`);
                        }}
                    >
                        <AiOutlinePlus className="w-4 h-4" />
                        Add Option
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Min Select</span>
                    </label>
                    <input
                        type="number"
                        min={0}
                        className="input input-bordered w-full"
                        {...form.register("minSelect", { valueAsNumber: true })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                    <label className="label">
                        <span className="label-text-alt">0 = no minimum</span>
                    </label>
                </div>
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Max Select</span>
                    </label>
                    <input
                        type="number"
                        min={0}
                        className="input input-bordered w-full"
                        {...form.register("maxSelect", { valueAsNumber: true })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                    <label className="label">
                        <span className="label-text-alt">0 = no limit</span>
                    </label>
                </div>
            </div>

            <div className="form-control w-full">
                <label className="label cursor-pointer">
                    <span className="label-text">Required</span>
                    <input
                        type="checkbox"
                        className="toggle"
                        {...form.register("required")}
                    />
                </label>
            </div>
        </form>
    );
}
