"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { RxDropdownMenu } from "react-icons/rx";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { LuCheck } from "react-icons/lu";

const type: FormElementType = FormElementType.SELECT;

const extraAttributes = {
    label: "Select Field",
    helperText: "Choose an option",
    required: false,
    placeholder: "Value here...",
    options: [], // Array of strings
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
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
    const { label, required, placeholder, helperText, options } = elementInstance.extraAttributes || extraAttributes;

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

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, helperText, placeholder, options } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-4 w-full">
            <label className={`text-xl md:text-2xl font-normal text-[#262627] ${error ? "text-error" : ""}`}>
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
                                flex items-center gap-3 p-2 rounded border border-[#262627]/30 bg-opacity-50 cursor-pointer overflow-hidden transition-all
                                hover:bg-[#0445AF]/5 hover:border-[#0445AF]
                                ${isSelected ? "bg-[#0445AF]/10 border-[#0445AF] ring-1 ring-[#0445AF]" : "bg-white/40"}
                            `}
                        >
                            <div className={`
                                w-6 h-6 flex items-center justify-center border rounded text-xs font-semibold
                                ${isSelected ? "bg-[#0445AF] text-white border-[#0445AF]" : "bg-white border-[#262627]/30 text-[#262627]"}
                            `}>
                                {keyChar}
                            </div>
                            <span className="text-lg text-[#262627]">{option}</span>
                            {isSelected && <LuCheck className="ml-auto text-[#0445AF]" />}
                        </div>
                    );
                })}
            </div>

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
            placeholder: defaults.placeholder,
            options: defaults.options,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, required, placeholder, options } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                required,
                placeholder,
                options,
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
                    <span className="label-text-alt">The label of the select field.</span>
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
                    <span className="label-text-alt">The placeholder of the select field.</span>
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

            <div className="divider">Options</div>

            <FormOptionsEditor form={form} />

            <div className="divider">Settings</div>

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

function FormOptionsEditor({ form }: { form: any }) {
    const options = form.watch("options");

    return (
        <div className="flex flex-col gap-2">
            {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center justify-between gap-1">
                    <input
                        className="input input-bordered input-sm flex-grow"
                        value={option}
                        onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            form.setValue("options", newOptions);
                        }}
                    />
                    <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={(e) => {
                            e.preventDefault();
                            const newOptions = [...options];
                            newOptions.splice(index, 1);
                            form.setValue("options", newOptions);
                        }}
                    >
                        <AiOutlineClose />
                    </button>
                </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
                <input
                    className="input input-bordered input-sm flex-grow"
                    placeholder="New Option"
                    id="newOptionInput"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.currentTarget.value;
                            if (val) {
                                form.setValue("options", [...options, val]);
                                e.currentTarget.value = "";
                            }
                        }
                    }}
                />
                <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                        e.preventDefault();
                        const input = document.getElementById("newOptionInput") as HTMLInputElement;
                        if (input && input.value) {
                            form.setValue("options", [...options, input.value]);
                            input.value = "";
                        }
                    }}
                >
                    Add
                </button>
            </div>
        </div>
    );
}
