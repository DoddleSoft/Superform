import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { LuClock } from "react-icons/lu";

const type: FormElementType = FormElementType.DATE;

const extraAttributes = {
    label: "Date Field",
    helperText: "Pick a date",
    required: false,
    includeTime: false,
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    required: z.boolean(),
    includeTime: z.boolean(),
});

export const DateFieldFormElement: FormElementHelper = {
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
    label: "Date Field"
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, includeTime } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text flex items-center gap-2">
                <BsFillCalendarDateFill className="w-4 h-4 text-primary" />
                {label}
                {includeTime && <LuClock className="w-3 h-3 text-base-content/50" />}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <input readOnly disabled type="date" className="input input-bordered flex-1" />
                {includeTime && (
                    <input readOnly disabled type="time" className="input input-bordered w-32" />
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
    const { label, required, helperText, includeTime } = elementInstance.extraAttributes || extraAttributes;

    // Parse default value for date and time
    const parseDefaultValue = () => {
        if (!defaultValue) return { date: "", time: "" };
        if (includeTime && defaultValue.includes("T")) {
            const [date, time] = defaultValue.split("T");
            return { date, time: time?.substring(0, 5) || "" };
        }
        return { date: defaultValue, time: "" };
    };

    const [dateValue, setDateValue] = useState(parseDefaultValue().date);
    const [timeValue, setTimeValue] = useState(parseDefaultValue().time);
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const getCombinedValue = (date: string, time: string) => {
        if (!date) return "";
        if (includeTime && time) {
            return `${date}T${time}`;
        }
        return date;
    };

    const handleDateChange = (newDate: string) => {
        setDateValue(newDate);
        const combined = getCombinedValue(newDate, timeValue);
        if (!submitValue) return;
        const valid = DateFieldFormElement.validate(elementInstance, combined);
        setError(!valid);
        submitValue(elementInstance.id, combined);
    };

    const handleTimeChange = (newTime: string) => {
        setTimeValue(newTime);
        const combined = getCombinedValue(dateValue, newTime);
        if (!submitValue) return;
        const valid = DateFieldFormElement.validate(elementInstance, combined);
        setError(!valid);
        submitValue(elementInstance.id, combined);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className={`form-field-label text-xl md:text-2xl font-normal text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <BsFillCalendarDateFill className="form-field-icon w-6 h-6" />
                {label}
                {includeTime && <LuClock className="form-field-icon w-5 h-5 text-[#262627]/50" />}
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <div className="flex gap-3 flex-wrap">
                <input
                    type="date"
                    className={`form-field-input flex-1 min-w-[200px] bg-transparent border-b border-[#262627]/30 text-2xl md:text-3xl py-2 focus:outline-none focus:border-[#0445AF] transition-colors ${error ? "border-error" : ""}`}
                    onChange={(e) => handleDateChange(e.target.value)}
                    value={dateValue}
                    onBlur={(e) => handleDateChange(e.target.value)}
                />
                {includeTime && (
                    <input
                        type="time"
                        className={`form-field-input w-40 bg-transparent border-b border-[#262627]/30 text-2xl md:text-3xl py-2 focus:outline-none focus:border-[#0445AF] transition-colors ${error ? "border-error" : ""}`}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        value={timeValue}
                        onBlur={(e) => handleTimeChange(e.target.value)}
                    />
                )}
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
            includeTime: defaults.includeTime,
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
                    <span className="label-text">Include Time</span>
                    <input
                        type="checkbox"
                        className="toggle"
                        {...form.register("includeTime")}
                    />
                </label>
                <label className="label">
                    <span className="label-text-alt">Add a time picker alongside date</span>
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
