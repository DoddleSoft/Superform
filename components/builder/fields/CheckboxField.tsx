import { MdCheckBox } from "react-icons/md";
import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { IoMdCheckbox } from "react-icons/io";
import { LuCheck } from "react-icons/lu";

const type: FormElementType = FormElementType.CHECKBOX;

const extraAttributes = {
    label: "Checkbox",
    helperText: "Check this box",
    required: false,
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    required: z.boolean(),
});

export const CheckboxFieldFormElement: FormElementHelper = {
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
            return currentValue === "true";
        }

        return true;
    },
    label: "Checkbox",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex items-start gap-2 w-full">
            <input type="checkbox" className="checkbox checkbox-primary" disabled checked />
            <div className="flex flex-col gap-1">
                <label className="label-text cursor-pointer">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
                {helperText && (
                    <p className="text-[0.8rem] text-base-content/70">{helperText}</p>
                )}
            </div>
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
    const [value, setValue] = useState<boolean>(defaultValue === "true");
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, helperText } = elementInstance.extraAttributes || extraAttributes;
    const id = `checkbox-${element.id}`;

    return (
        <div className="flex flex-col gap-2 w-full">
            <div
                className={`
                    form-field-option flex items-center gap-3 p-4 rounded border border-[#262627]/30 bg-opacity-50 cursor-pointer overflow-hidden transition-all
                    hover:bg-[#0445AF]/5 hover:border-[#0445AF]
                    ${value ? "bg-[#0445AF]/10 border-[#0445AF] ring-1 ring-[#0445AF]" : "bg-white/40"}
                    ${error ? "border-error" : ""}
                `}
                onClick={() => {
                    const newValue = !value;
                    setValue(newValue);
                    if (!submitValue) return;
                    const stringValue = newValue ? "true" : "false";
                    const valid = CheckboxFieldFormElement.validate(elementInstance, stringValue);
                    setError(!valid);
                    submitValue(elementInstance.id, stringValue);
                }}
            >
                <div className={`
                    form-field-option-key w-6 h-6 flex items-center justify-center border rounded text-xs
                    ${value ? "bg-[#0445AF] text-white border-[#0445AF]" : "bg-white border-[#262627]/30 text-[#262627]"}
                `}>
                    {value && <LuCheck />}
                </div>

                <div className="flex flex-col">
                    <span className={`form-field-label text-xl md:text-2xl font-normal text-[#262627] ${error ? "text-error" : ""}`}>
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </span>
                    {helperText && (
                        <span className={`form-field-helper text-base text-[#262627]/60 ${error ? "text-error" : ""}`}>
                            {helperText}
                        </span>
                    )}
                </div>
            </div>
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
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, required } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                required,
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
