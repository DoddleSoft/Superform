import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { LuClock, LuType, LuSettings } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle 
} from "@/components/builder/properties";

const type: FormElementType = FormElementType.DATE;

const extraAttributes = {
    label: "Date Field",
    helperText: "Pick a date",
    showHelperText: false,
    required: false,
    includeTime: false,
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    showHelperText: z.boolean(),
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
    const { label, required, helperText, showHelperText, includeTime } = elementInstance.extraAttributes || extraAttributes;

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
    const { label, required, helperText, showHelperText, includeTime } = elementInstance.extraAttributes || extraAttributes;

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
        <div className="flex flex-col gap-3 w-full">
            <label className={`form-field-label text-base md:text-lg font-medium text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <BsFillCalendarDateFill className="form-field-icon w-5 h-5" />
                {label}
                {includeTime && <LuClock className="form-field-icon w-4 h-4 text-[#262627]/50" />}
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <div className="flex gap-3 flex-wrap">
                <input
                    type="date"
                    className={`form-field-input flex-1 min-w-[180px] bg-transparent border-b-2 border-[#262627]/20 text-base md:text-lg py-2 focus:outline-none focus:border-[#0445AF] transition-colors ${error ? "border-error" : ""}`}
                    onChange={(e) => handleDateChange(e.target.value)}
                    value={dateValue}
                    onBlur={(e) => handleDateChange(e.target.value)}
                />
                {includeTime && (
                    <input
                        type="time"
                        className={`form-field-input w-32 bg-transparent border-b-2 border-[#262627]/20 text-base md:text-lg py-2 focus:outline-none focus:border-[#0445AF] transition-colors ${error ? "border-error" : ""}`}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        value={timeValue}
                        onBlur={(e) => handleTimeChange(e.target.value)}
                    />
                )}
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
            includeTime: defaults.includeTime,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        const { label, helperText, showHelperText, required, includeTime } = values;
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                label,
                helperText,
                showHelperText,
                required,
                includeTime,
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

            <PropertySection title="Options" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Include Time"
                    description="Add a time picker alongside date"
                    {...form.register("includeTime")}
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
