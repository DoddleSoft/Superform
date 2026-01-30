"use client";

import { FormElementInstance, FormElementType, FormElementHelper } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BsTelephone } from "react-icons/bs";

const type: FormElementType = FormElementType.PHONE;

// Phone regex - allows international formats
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

const extraAttributes = {
    label: "Phone Number",
    helperText: "Enter your phone number",
    required: false,
    placeholder: "+1 (555) 000-0000",
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    required: z.boolean(),
    placeholder: z.string().max(50),
});

export const PhoneFieldFormElement: FormElementHelper = {
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
        if (element.extraAttributes?.required && currentValue.length === 0) {
            return false;
        }
        // Remove spaces and dashes for validation
        const cleaned = currentValue.replace(/[\s\-\.\(\)]/g, "");
        if (currentValue.length > 0 && (cleaned.length < 7 || !PHONE_REGEX.test(currentValue))) {
            return false;
        }
        return true;
    },
    label: "Phone Number",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, placeholder, helperText } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text flex items-center gap-2">
                <BsTelephone className="w-4 h-4 text-primary" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <input
                readOnly
                disabled
                type="tel"
                className="input input-bordered w-full"
                placeholder={placeholder}
            />
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

    const [value, setValue] = useState(defaultValue || "");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, placeholder, helperText } = elementInstance.extraAttributes || extraAttributes;

    const validateAndSubmit = (val: string) => {
        if (!submitValue) return;
        
        const valid = PhoneFieldFormElement.validate(elementInstance, val);
        setError(!valid);
        
        if (!valid && val.length > 0) {
            setErrorMessage("Please enter a valid phone number");
        } else {
            setErrorMessage("");
        }
        
        submitValue(elementInstance.id, val);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className={`form-field-label text-xl md:text-2xl font-normal text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <BsTelephone className="form-field-icon w-6 h-6" />
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <input
                type="tel"
                className={`form-field-input w-full bg-transparent border-b border-[#262627]/30 text-2xl md:text-3xl py-2 focus:outline-none focus:border-[#0445AF] transition-colors placeholder:text-[#262627]/20 ${error ? "border-error" : ""}`}
                placeholder={placeholder}
                onChange={(e) => {
                    setValue(e.target.value);
                    validateAndSubmit(e.target.value);
                }}
                onBlur={(e) => {
                    validateAndSubmit(e.target.value);
                }}
                value={value}
            />
            {errorMessage && (
                <p className="form-field-helper text-lg text-error">{errorMessage}</p>
            )}
            {!errorMessage && helperText && (
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
            placeholder: defaults.placeholder,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, required, placeholder } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                required,
                placeholder,
            },
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
                <label className="label">
                    <span className="label-text-alt">The label of the field.</span>
                </label>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Placeholder</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    {...form.register("placeholder")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
                <label className="label">
                    <span className="label-text-alt">The placeholder of the field.</span>
                </label>
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
                <label className="label">
                    <span className="label-text-alt">Displayed below the field.</span>
                </label>
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
                <label className="label">
                    <span className="label-text-alt">Is this field required?</span>
                </label>
            </div>
        </form>
    );
}
