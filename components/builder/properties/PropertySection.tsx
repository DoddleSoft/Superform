"use client";

import { ReactNode } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { useState } from "react";

interface PropertySectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    collapsible?: boolean;
    badge?: string | number;
}

export function PropertySection({
    title,
    icon,
    children,
    defaultOpen = true,
    collapsible = true,
    badge,
}: PropertySectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-base-200 last:border-b-0">
            <button
                type="button"
                onClick={() => collapsible && setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center gap-2 px-4 py-3 text-left
                    ${collapsible ? "hover:bg-base-200/50 cursor-pointer" : "cursor-default"}
                    transition-colors
                `}
                disabled={!collapsible}
            >
                {collapsible && (
                    <span className="text-base-content/40">
                        {isOpen ? (
                            <LuChevronDown className="w-4 h-4" />
                        ) : (
                            <LuChevronRight className="w-4 h-4" />
                        )}
                    </span>
                )}
                {icon && (
                    <span className="text-base-content/50">
                        {icon}
                    </span>
                )}
                <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    {title}
                </span>
                {badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-base-200 text-base-content/60 rounded">
                        {badge}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className="px-4 pb-4 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
}
