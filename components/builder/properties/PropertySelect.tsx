"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface PropertySelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    label: string;
    description?: string;
    error?: string;
    size?: "sm" | "md";
    options: { value: string; label: string }[];
}

export const PropertySelect = forwardRef<HTMLSelectElement, PropertySelectProps>(
    function PropertySelect(
        { label, description, error, size = "sm", options, className = "", ...props },
        ref
    ) {
        const selectSizeClass = size === "sm" ? "select-sm" : "";
        
        return (
            <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">
                        {label}
                    </span>
                </label>
                <select
                    ref={ref}
                    className={`
                        select select-bordered w-full ${selectSizeClass}
                        focus:select-primary
                        ${error ? "select-error" : ""}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
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
