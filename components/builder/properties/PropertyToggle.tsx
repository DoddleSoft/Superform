"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { LuInfo } from "react-icons/lu";

interface PropertyToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label: string;
    description?: string;
    size?: "sm" | "md";
    onToggleChange?: (checked: boolean) => void;
}

export const PropertyToggle = forwardRef<HTMLInputElement, PropertyToggleProps>(
    function PropertyToggle(
        { label, description, size = "sm", className = "", onToggleChange, onChange, ...props },
        ref
    ) {
        const toggleSizeClass = size === "sm" ? "toggle-sm" : "";
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Call the original onChange from react-hook-form register
            if (onChange) {
                onChange(e);
            }
            // Also call the immediate change handler if provided
            if (onToggleChange) {
                onToggleChange(e.target.checked);
            }
        };
        
        return (
            <div className="flex items-start justify-between gap-3 py-1">
                <div className="flex-1 space-y-0.5">
                    <label 
                        className="text-sm font-medium text-base-content/80 cursor-pointer"
                        htmlFor={props.id || props.name}
                    >
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-base-content/50">
                            {description}
                        </p>
                    )}
                </div>
                <input
                    ref={ref}
                    type="checkbox"
                    id={props.id || props.name}
                    className={`
                        toggle toggle-primary ${toggleSizeClass}
                        ${className}
                    `}
                    onChange={handleChange}
                    {...props}
                />
            </div>
        );
    }
);
