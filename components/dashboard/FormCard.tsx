"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FiMoreVertical, FiEdit2, FiCopy, FiTrash2, FiExternalLink } from "react-icons/fi";
import type { FormWithStats } from "@/types/form-builder";

interface FormCardProps {
    form: FormWithStats;
    onEdit: (form: FormWithStats) => void;
    onDuplicate: (form: FormWithStats) => void;
    onDelete: (form: FormWithStats) => void;
}

export function FormCard({ form, onEdit, onDuplicate, onDelete }: FormCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-200 group"
        >
            <div className="card-body p-5">
                {/* Header with title and menu */}
                <div className="flex items-start justify-between gap-2">
                    <Link
                        href={`/builder/${form.id}`}
                        className="flex-1 min-w-0"
                    >
                        <h2 className="card-title text-base font-semibold truncate hover:text-primary transition-colors">
                            {form.name}
                        </h2>
                    </Link>
                    
                    {/* Dropdown menu */}
                    <div className="dropdown dropdown-end">
                        <label
                            tabIndex={0}
                            className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FiMoreVertical className="w-4 h-4" />
                        </label>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-48 z-10 border border-base-200"
                        >
                            <li>
                                <Link href={`/builder/${form.id}`}>
                                    <FiEdit2 className="w-4 h-4" />
                                    Open in Builder
                                </Link>
                            </li>
                            {form.published && form.share_url && (
                                <li>
                                    <Link
                                        href={`/submit/${form.share_url}`}
                                        target="_blank"
                                    >
                                        <FiExternalLink className="w-4 h-4" />
                                        View Live Form
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button onClick={() => onEdit(form)}>
                                    <FiEdit2 className="w-4 h-4" />
                                    Edit Details
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onDuplicate(form)}>
                                    <FiCopy className="w-4 h-4" />
                                    Duplicate
                                </button>
                            </li>
                            <div className="divider my-1"></div>
                            <li>
                                <button
                                    onClick={() => onDelete(form)}
                                    className="text-error hover:bg-error hover:text-error-content"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-base-content/60 line-clamp-2 min-h-[2.5rem]">
                    {form.description || "No description"}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2 text-sm text-base-content/50">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {form.submission_count} {form.submission_count === 1 ? "response" : "responses"}
                    </span>
                </div>

                {/* Footer */}
                <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
                    <span className="text-xs text-base-content/40">
                        Updated {formatDate(form.updated_at || form.created_at)}
                    </span>
                    <div className={`badge badge-sm ${form.published ? "badge-success" : "badge-ghost"}`}>
                        {form.published ? "Published" : "Draft"}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
