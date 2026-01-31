"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface PropertyTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
    label: string;
    description?: string;
    error?: string;
    size?: "sm" | "md";
}

export const PropertyTextarea = forwardRef<HTMLTextAreaElement, PropertyTextareaProps>(
    function PropertyTextarea(
        { label, description, error, size = "sm", className = "", ...props },
        ref
    ) {
        const textareaSizeClass = size === "sm" ? "textarea-sm" : "";
        
        return (
            <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">
                        {label}
                    </span>
                </label>
                <textarea
                    ref={ref}
                    className={`
                        textarea textarea-bordered w-full ${textareaSizeClass}
                        focus:textarea-primary resize-none
                        ${error ? "textarea-error" : ""}
                        ${className}
                    `}
                    rows={3}
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
