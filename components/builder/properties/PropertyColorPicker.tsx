"use client";

import { InputHTMLAttributes, forwardRef, useState, useRef, useEffect } from "react";

interface PropertyColorPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange"> {
    label: string;
    description?: string;
    error?: string;
    value: string;
    onChange: (value: string) => void;
}

export const PropertyColorPicker = forwardRef<HTMLInputElement, PropertyColorPickerProps>(
    function PropertyColorPicker(
        { label, description, error, value, onChange, className = "", ...props },
        ref
    ) {
        const [inputValue, setInputValue] = useState(value);
        const colorInputRef = useRef<HTMLInputElement>(null);

        // Sync input value when prop changes
        useEffect(() => {
            setInputValue(value);
        }, [value]);

        const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            onChange(newValue);
        };

        const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            // Only update if it's a valid hex color
            if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
                onChange(newValue);
            }
        };

        const handleTextBlur = () => {
            // On blur, if the value is invalid, reset to the current value
            if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
                setInputValue(value);
            }
        };

        return (
            <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">
                        {label}
                    </span>
                </label>
                <div className="flex items-center gap-2">
                    {/* Color preview/picker button */}
                    <button
                        type="button"
                        className={`
                            w-9 h-9 rounded-lg border-2 border-base-300 cursor-pointer 
                            flex-shrink-0 transition-all hover:border-primary focus:border-primary
                            focus:ring-2 focus:ring-primary/20
                            ${error ? "border-error" : ""}
                        `}
                        style={{ backgroundColor: value }}
                        onClick={() => colorInputRef.current?.click()}
                        aria-label={`Pick color for ${label}`}
                    />
                    {/* Hidden native color picker */}
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={value}
                        onChange={handleColorChange}
                        className="sr-only"
                        tabIndex={-1}
                        {...props}
                    />
                    {/* Hex input */}
                    <input
                        ref={ref}
                        type="text"
                        value={inputValue}
                        onChange={handleTextChange}
                        onBlur={handleTextBlur}
                        className={`
                            input input-bordered input-sm flex-1 font-mono uppercase
                            focus:input-primary
                            ${error ? "input-error" : ""}
                            ${className}
                        `}
                        placeholder="#000000"
                        maxLength={7}
                    />
                </div>
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
