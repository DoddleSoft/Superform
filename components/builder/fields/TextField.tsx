"use client";

import { FormElementInstance, FormElementType } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { useState, useEffect } from "react";

export const TextFieldFormElement = {
    type: FormElementType.TEXT_FIELD,
    construct: (id: string) => ({
        id,
        type: FormElementType.TEXT_FIELD,
        label: "Text Field",
        placeholder: "Enter text here",
        required: false,
        properties: {
            helperText: "",
        },
    }),
    designerComponent: TextFieldDesignerComponent,
    formComponent: TextFieldFormComponent,
    propertiesComponent: TextFieldPropertiesComponent,
    label: "Text Field",
    validate: (element: FormElementInstance, currentValue: string): boolean => {
        const elementInstance = element as CustomInstance;
        if (elementInstance.required) {
            return currentValue.length > 0;
        }

        return true;
    },
};

type CustomInstance = FormElementInstance & {
    properties: {
        helperText?: string;
    };
};

function TextFieldDesignerComponent({ element }: { element: FormElementInstance }) {
    return (
        <div className="flex flex-col gap-2 w-full pointer-events-none">
            <label className="label">
                <span className="label-text">
                    {element.label} {element.required && <span className="text-error">*</span>}
                </span>
            </label>
            <input
                type="text"
                className="input input-bordered w-full"
                placeholder={element.placeholder}
                disabled
            />
            {element.properties?.helperText && (
                <span className="label-text-alt text-base-content/70">{element.properties.helperText}</span>
            )}
        </div>
    );
}

function TextFieldFormComponent({
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
    const [value, setValue] = useState(defaultValue || "");
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { helperText } = element.properties as CustomInstance["properties"];

    return (
        <div className="form-control w-full">
            <label className="label">
                <span className={`label-text ${error && "text-error"}`}>
                    {element.label} {element.required && <span className="text-error">*</span>}
                </span>
            </label>
            <input
                type="text"
                className={`input input-bordered w-full ${error && "input-error"}`}
                placeholder={element.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={(e) => {
                    if (!submitValue) return;
                    const valid = TextFieldFormElement.validate(element, e.target.value);
                    setError(!valid);
                    submitValue(element.id, e.target.value);
                }}
            />
            {helperText && (
                <span className={`label-text-alt mt-1 ${error ? "text-error" : "text-base-content/70"}`}>
                    {helperText}
                </span>
            )}
        </div>
    );
}

function TextFieldPropertiesComponent({ element }: { element: FormElementInstance }) {
    const { updateElement } = useFormBuilder();

    return (
        <div className="flex flex-col gap-4">
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Label</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={element.label}
                    onChange={(e) => updateElement(element.id, { label: e.target.value })}
                />
            </div>
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Placeholder</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={element.placeholder || ""}
                    onChange={(e) => updateElement(element.id, { placeholder: e.target.value })}
                />
            </div>
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Helper Text</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={element.properties?.helperText || ""}
                    onChange={(e) => updateElement(element.id, { properties: { ...element.properties, helperText: e.target.value } })}
                />
            </div>
            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                    <span className="label-text">Required</span>
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={element.required}
                        onChange={(e) => updateElement(element.id, { required: e.target.checked })}
                    />
                </label>
            </div>
        </div>
    );
}
