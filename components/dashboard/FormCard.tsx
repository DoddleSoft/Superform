"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LuEllipsis, LuPencil, LuCopy, LuTrash2, LuExternalLink, LuSquarePen } from "react-icons/lu";
import type { FormWithStats } from "@/types/form-builder";

interface FormCardProps {
    form: FormWithStats;
    index?: number;
    onEdit: (form: FormWithStats) => void;
    onDuplicate: (form: FormWithStats) => void;
    onDelete: (form: FormWithStats) => void;
}

// Gradient presets for form cards
const gradients = [
    "from-yellow-300 via-yellow-400 to-amber-500",
    "from-pink-300 via-pink-400 to-rose-500",
    "from-cyan-300 via-cyan-400 to-teal-500",
    "from-violet-300 via-violet-400 to-purple-500",
    "from-orange-300 via-orange-400 to-red-500",
    "from-emerald-300 via-emerald-400 to-green-500",
    "from-blue-300 via-blue-400 to-indigo-500",
    "from-fuchsia-300 via-fuchsia-400 to-pink-500",
];

export function FormCard({ form, index = 0, onEdit, onDuplicate, onDelete }: FormCardProps) {
    // Pick gradient based on form name hash for consistency
    const getGradientIndex = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % gradients.length;
    };

    const gradient = gradients[getGradientIndex(form.name)];
    const hasGradient = form.published; // Only published forms get colorful backgrounds

    const [isTop, setIsTop] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    const checkPosition = () => {
        if (!dropdownRef.current) return;

        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const spaceAbove = dropdownRect.top;

        // Estimate menu height if not visible yet (approx 260px for the menu)
        // or use actual height if customized
        const menuHeight = 260;

        // If there's enough space above, show it on top
        if (spaceAbove > menuHeight + 20) {
            setIsTop(true);
        } else {
            setIsTop(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative"
        >
            <Link href={`/builder/${form.id}`} className="block">
                <div
                    className={`relative overflow-hidden rounded-2xl aspect-[4/3] transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] ${hasGradient
                        ? `bg-gradient-to-br ${gradient}`
                        : "bg-base-100 border border-base-200"
                        }`}
                >
                    {/* Decorative wave shape for gradient cards */}
                    {hasGradient && (
                        <div className="absolute bottom-0 left-0 right-0 h-1/3">
                            <svg
                                viewBox="0 0 400 100"
                                className="absolute bottom-0 w-full h-full"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M0,40 C100,80 200,20 300,60 C350,80 400,50 400,50 L400,100 L0,100 Z"
                                    fill="rgba(0,0,0,0.12)"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Title centered in card */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <h3
                            className={`text-lg font-semibold text-center line-clamp-3 ${hasGradient ? "text-white drop-shadow-sm" : "text-base-content"
                                }`}
                        >
                            {form.name}
                        </h3>
                    </div>

                    {/* Draft badge for unpublished forms */}
                    {!form.published && (
                        <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center px-2.5 py-1 bg-base-100/90 backdrop-blur-sm text-base-content/70 text-xs font-medium rounded-lg">
                                Draft
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Bottom bar with response count and menu */}
            <div className="flex items-center justify-between mt-2.5 px-1">
                <span className="text-xs text-base-content/50 font-medium">
                    {form.submission_count === 0
                        ? "No responses"
                        : form.submission_count === 1
                            ? "1 response"
                            : `${form.submission_count} responses`}
                </span>

                {/* Dropdown menu */}
                <div
                    className={`dropdown dropdown-end ${isTop ? 'dropdown-top' : 'dropdown-bottom'}`}
                    ref={dropdownRef}
                >
                    <label
                        tabIndex={0}
                        className="p-1.5 rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer block"
                        onClick={(e) => {
                            e.preventDefault();
                            checkPosition();
                        }}
                        onMouseEnter={checkPosition}
                        onTouchStart={checkPosition}
                    >
                        <LuEllipsis className="w-4 h-4" />
                    </label>
                    <ul
                        tabIndex={0}
                        ref={menuRef}
                        className="dropdown-content mt-2 p-1.5 shadow-lg bg-base-100 rounded-xl w-48 z-10 border border-base-200"
                    >
                        <li>
                            <Link
                                href={`/builder/${form.id}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-colors"
                            >
                                <LuSquarePen className="w-4 h-4" />
                                Open in Builder
                            </Link>
                        </li>
                        {form.published && form.share_url && (
                            <li>
                                <Link
                                    href={`/submit/${form.share_url}`}
                                    target="_blank"
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-colors"
                                >
                                    <LuExternalLink className="w-4 h-4" />
                                    View Live Form
                                </Link>
                            </li>
                        )}
                        <li>
                            <button
                                onClick={() => onEdit(form)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-colors"
                            >
                                <LuPencil className="w-4 h-4" />
                                Edit Details
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => onDuplicate(form)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-colors"
                            >
                                <LuCopy className="w-4 h-4" />
                                Duplicate
                            </button>
                        </li>
                        <li className="my-1 border-t border-base-200"></li>
                        <li>
                            <button
                                onClick={() => onDelete(form)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                            >
                                <LuTrash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}
