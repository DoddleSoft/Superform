"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface PropertyFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    label: string;
    description?: string;
    error?: string;
    size?: "sm" | "md";
}

export const PropertyField = forwardRef<HTMLInputElement, PropertyFieldProps>(
    function PropertyField(
        { label, description, error, size = "sm", className = "", ...props },
        ref
    ) {
        const inputSizeClass = size === "sm" ? "input-sm" : "";
        
        return (
            <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">
                        {label}
                    </span>
                    {props.required && (
                        <span className="text-[10px] text-error font-medium uppercase tracking-wide">
                            Required
                        </span>
                    )}
                </label>
                <input
                    ref={ref}
                    className={`
                        input input-bordered w-full ${inputSizeClass}
                        focus:input-primary
                        ${error ? "input-error" : ""}
                        ${className}
                    `}
                    {...props}
                />
                {description && !error && (
                    <p className="text-xs text-base-content/50">
                        {description}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-error">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
