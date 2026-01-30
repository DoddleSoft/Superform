"use client";

import { FormElementType, FormElementInstance, FormElementHelper } from "@/types/form-builder";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const type: FormElementType = FormElementType.RATING;

const extraAttributes = {
    label: "Rating",
    helperText: "Rate your experience",
    required: false,
    maxRating: 5, // 5 or 10 are common
    ratingStyle: "stars" as "stars" | "numbers", // stars or numbers
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    required: z.boolean(),
    maxRating: z.number().min(3).max(10),
    ratingStyle: z.enum(["stars", "numbers"]),
});

export const RatingFieldFormElement: FormElementHelper = {
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
            const rating = parseInt(currentValue, 10);
            return !isNaN(rating) && rating > 0;
        }
        return true;
    },
    label: "Rating",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, maxRating, ratingStyle } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text flex items-center gap-2">
                <AiFillStar className="w-4 h-4 text-warning" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-1">
                {ratingStyle === "stars" ? (
                    Array.from({ length: Math.min(maxRating, 5) }).map((_, i) => (
                        <AiFillStar key={i} className="w-6 h-6 text-warning/40" />
                    ))
                ) : (
                    Array.from({ length: Math.min(maxRating, 5) }).map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded border border-base-300 flex items-center justify-center text-sm">
                            {i + 1}
                        </div>
                    ))
                )}
                {maxRating > 5 && <span className="text-xs text-base-content/50 ml-1">...{maxRating}</span>}
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
    const [rating, setRating] = useState<number>(defaultValue ? parseInt(defaultValue, 10) : 0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const { label, required, helperText, maxRating, ratingStyle } = elementInstance.extraAttributes || extraAttributes;

    const handleClick = (value: number) => {
        setRating(value);
        setError(false);
        if (submitValue) {
            submitValue(elementInstance.id, value.toString());
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="flex flex-col gap-4 w-full">
            <label className={`form-field-label text-xl md:text-2xl font-normal text-[#262627] flex items-center gap-2 ${error ? "text-error" : ""}`}>
                <AiFillStar className="form-field-icon w-6 h-6 text-warning" />
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>

            {ratingStyle === "stars" ? (
                <div 
                    className="flex gap-2"
                    onMouseLeave={() => setHoverRating(0)}
                >
                    {Array.from({ length: maxRating }).map((_, i) => {
                        const value = i + 1;
                        const isFilled = value <= displayRating;
                        
                        return (
                            <button
                                key={i}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(value)}
                                onClick={() => handleClick(value)}
                            >
                                {isFilled ? (
                                    <AiFillStar className="form-rating-star w-10 h-10 md:w-12 md:h-12 text-warning drop-shadow-sm" />
                                ) : (
                                    <AiOutlineStar className="form-rating-star w-10 h-10 md:w-12 md:h-12 text-[#262627]/30 hover:text-warning/50" />
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: maxRating }).map((_, i) => {
                        const value = i + 1;
                        const isSelected = value === rating;
                        
                        return (
                            <button
                                key={i}
                                type="button"
                                className={`
                                    form-rating-number w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 text-lg md:text-xl font-semibold
                                    transition-all focus:outline-none focus:ring-2 focus:ring-[#0445AF]/50
                                    ${isSelected 
                                        ? "bg-[#0445AF] text-white border-[#0445AF]" 
                                        : "bg-white/40 text-[#262627] border-[#262627]/30 hover:border-[#0445AF] hover:bg-[#0445AF]/5"}
                                    ${error ? "border-error" : ""}
                                `}
                                onClick={() => handleClick(value)}
                            >
                                {value}
                            </button>
                        );
                    })}
                </div>
            )}

            {rating > 0 && (
                <p className="form-field-helper text-base text-[#262627]/50">
                    You selected: {rating} / {maxRating}
                </p>
            )}

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
            maxRating: defaults.maxRating,
            ratingStyle: defaults.ratingStyle,
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
                    <span className="label-text">Rating Style</span>
                </label>
                <select
                    className="select select-bordered w-full"
                    {...form.register("ratingStyle")}
                >
                    <option value="stars">Stars ⭐</option>
                    <option value="numbers">Numbers (1-N)</option>
                </select>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Maximum Rating</span>
                </label>
                <input
                    type="number"
                    min={3}
                    max={10}
                    className="input input-bordered w-full"
                    {...form.register("maxRating", { valueAsNumber: true })}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />
                <label className="label">
                    <span className="label-text-alt">Between 3 and 10</span>
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
            </div>
        </form>
    );
}
