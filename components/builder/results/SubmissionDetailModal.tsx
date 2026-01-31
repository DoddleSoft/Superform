"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LuX,
    LuCircleAlert,
    LuCircleCheck,
    LuArchive,
    LuCalendar,
    LuHash,
} from "react-icons/lu";
import { SubmissionWithProgress } from "@/types/submission";
import { Column, CellValue, StatusBadge, VersionBadge } from "./SubmissionsTable";

interface SubmissionDetailModalProps {
    submission: SubmissionWithProgress | null;
    columns: Column[];
    onClose: () => void;
}

export function SubmissionDetailModal({
    submission,
    columns,
    onClose,
}: SubmissionDetailModalProps) {
    if (!submission) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 shrink-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-semibold text-base-content">Response Details</h2>
                                <VersionBadge version={submission.form_version} />
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-base-content/50">
                                <span className="flex items-center gap-1">
                                    <LuCalendar className="w-3.5 h-3.5" />
                                    {new Date(submission.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <LuHash className="w-3.5 h-3.5" />
                                    {submission.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                        <button
                            className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={onClose}
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Overview */}
                    <div className="px-6 py-4 bg-base-50 border-b border-base-200 shrink-0">
                        <div className="flex items-center gap-4">
                            <StatusBadge
                                isComplete={submission.is_complete}
                                progress={submission.progress}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-base-content/50">
                                        {submission.answeredFields} of {submission.totalFields} fields answered
                                    </span>
                                    <span className="text-xs font-semibold text-base-content/70">
                                        {submission.progress}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${submission.progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${
                                            submission.is_complete ? "bg-success" : "bg-warning"
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-3">
                            {columns.map((col, index) => {
                                const value = submission.data?.[col.id];
                                const hasValue =
                                    value !== undefined && value !== null && value !== "";

                                return (
                                    <motion.div
                                        key={col.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`p-4 rounded-xl border transition-colors ${
                                            col.isDeleted
                                                ? "border-warning/30 bg-warning/5"
                                                : hasValue
                                                ? "border-base-200 bg-base-100 hover:border-primary/30"
                                                : "border-dashed border-base-300 bg-base-200/20"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-sm font-medium mb-1 flex items-center gap-1.5 ${
                                                        col.isDeleted
                                                            ? "text-warning"
                                                            : "text-base-content/70"
                                                    }`}
                                                >
                                                    {col.isDeleted && (
                                                        <LuArchive className="w-3.5 h-3.5 shrink-0" />
                                                    )}
                                                    <span className="truncate">{col.label}</span>
                                                    {col.isDeleted && (
                                                        <span className="badge badge-warning badge-xs">
                                                            deleted
                                                        </span>
                                                    )}
                                                </p>
                                                {hasValue ? (
                                                    <div className="text-base break-words">
                                                        <CellValue value={value} type={col.type} />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-base-content/40 italic">
                                                        Not answered
                                                    </p>
                                                )}
                                            </div>
                                            {hasValue ? (
                                                <LuCircleCheck className="w-5 h-5 text-success shrink-0" />
                                            ) : (
                                                <LuCircleAlert className="w-5 h-5 text-base-content/20 shrink-0" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-base-200 shrink-0">
                        <button 
                            className="px-4 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
