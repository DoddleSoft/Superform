"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType, FormSection } from "@/types/form-builder";
import {
    FormSubmission,
    SubmissionWithProgress,
    calculateSubmissionProgress,
} from "@/types/submission";
import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LuDownload,
    LuClock,
    LuCircleCheck,
    LuInbox,
} from "react-icons/lu";
import {
    VersionFilter,
    SubmissionsTable,
    SubmissionDetailModal,
    Column,
} from "./results";

type FilterMode = "all" | "complete" | "partial";

// Helper to extract columns from a sections array (current form or snapshot)
function extractColumnsFromSections(sections: FormSection[]): Column[] {
    const cols: Column[] = [];
    const allElements = sections.flatMap((section) => section.elements);

    allElements.forEach((element) => {
        switch (element.type) {
            case FormElementType.TEXT_FIELD:
            case FormElementType.NUMBER:
            case FormElementType.TEXTAREA:
            case FormElementType.DATE:
            case FormElementType.CHECKBOX:
            case FormElementType.SELECT:
            case FormElementType.EMAIL:
            case FormElementType.PHONE:
            case FormElementType.RADIO_GROUP:
            case FormElementType.CHECKBOX_GROUP:
            case FormElementType.RATING:
            case FormElementType.YES_NO:
                cols.push({
                    id: element.id,
                    label:
                        element.extraAttributes?.label ||
                        element.type ||
                        "Field",
                    type: element.type,
                });
                break;
        }
    });
    return cols;
}

export function ResultsView({ submissions }: { submissions: FormSubmission[] }) {
    const { sections } = useFormBuilder();
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
    const [selectedSubmission, setSelectedSubmission] =
        useState<SubmissionWithProgress | null>(null);

    // Extract unique versions from submissions
    const availableVersions = useMemo(() => {
        const versions = new Set<number>();
        submissions.forEach((sub) => {
            if (sub.form_version) {
                versions.add(sub.form_version);
            }
        });
        return Array.from(versions).sort((a, b) => a - b);
    }, [submissions]);

    // Get current form columns
    const currentColumns: Column[] = useMemo(() => {
        return extractColumnsFromSections(sections);
    }, [sections]);

    // Filter submissions by selected versions
    const versionFilteredSubmissions = useMemo(() => {
        if (selectedVersions.length === 0) {
            // "All" selected - show all submissions
            return submissions;
        }
        return submissions.filter(
            (sub) => sub.form_version && selectedVersions.includes(sub.form_version)
        );
    }, [submissions, selectedVersions]);

    // Merge columns: current form + any fields from selected version snapshots
    // This ensures we can display responses for fields that were later deleted
    const columns: Column[] = useMemo(() => {
        const columnMap = new Map<string, Column>();

        // Add current columns first
        currentColumns.forEach((col) => {
            columnMap.set(col.id, col);
        });

        // Check filtered submissions with snapshots for additional fields
        versionFilteredSubmissions.forEach((submission) => {
            if (submission.form_content_snapshot) {
                const snapshotCols = extractColumnsFromSections(
                    submission.form_content_snapshot
                );
                snapshotCols.forEach((col) => {
                    if (!columnMap.has(col.id)) {
                        // This is a deleted field - add it with marker
                        columnMap.set(col.id, { ...col, isDeleted: true });
                    }
                });
            }
        });

        // Sort: current fields first, then deleted fields
        return Array.from(columnMap.values()).sort((a, b) => {
            if (a.isDeleted && !b.isDeleted) return 1;
            if (!a.isDeleted && b.isDeleted) return -1;
            return 0;
        });
    }, [currentColumns, versionFilteredSubmissions]);

    // Process submissions with progress
    const processedSubmissions: SubmissionWithProgress[] = useMemo(() => {
        return versionFilteredSubmissions.map((sub) =>
            calculateSubmissionProgress(sub, columns.length)
        );
    }, [versionFilteredSubmissions, columns.length]);

    // Filter submissions based on completion status mode
    const filteredSubmissions = useMemo(() => {
        switch (filterMode) {
            case "complete":
                return processedSubmissions.filter((s) => s.is_complete);
            case "partial":
                return processedSubmissions.filter((s) => !s.is_complete);
            default:
                return processedSubmissions;
        }
    }, [processedSubmissions, filterMode]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            "Submitted At",
            "Status",
            "Progress",
            "Version",
            ...columns.map((c) => c.label),
        ];

        const rows = filteredSubmissions.map((sub) => {
            const values = columns.map((col) => {
                const value = sub.data?.[col.id] || "";
                // Escape quotes and wrap in quotes if contains comma
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            return [
                `"${new Date(sub.created_at).toLocaleString()}"`,
                sub.is_complete ? "Complete" : "Partial",
                `${sub.progress}%`,
                sub.form_version || "—",
                ...values,
            ].join(",");
        });

        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Include version info in filename if filtering
        const versionSuffix =
            selectedVersions.length > 0
                ? `-v${selectedVersions.join("-")}`
                : "-all-versions";
        a.download = `submissions${versionSuffix}-${new Date().toISOString().split("T")[0]
            }.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [columns, filteredSubmissions, selectedVersions]);

    return (
        <div className="flex flex-col h-full w-full bg-base-100">
            {/* Toolbar */}
            <Toolbar
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                onExport={exportToCSV}
                totalCount={filteredSubmissions.length}
                availableVersions={availableVersions}
                selectedVersions={selectedVersions}
                onVersionChange={setSelectedVersions}
            />

            {/* Content */}
            <div className="flex-1 overflow-hidden min-w-0">
                {filteredSubmissions.length === 0 ? (
                    <EmptyState filterMode={filterMode} />
                ) : (
                    <AnimatePresence mode="wait">
                        <SubmissionsTable
                            key="table"
                            submissions={filteredSubmissions}
                            columns={columns}
                            onRowClick={setSelectedSubmission}
                        />
                    </AnimatePresence>
                )}
            </div>

            {/* Detail Modal */}
            <SubmissionDetailModal
                submission={selectedSubmission}
                columns={columns}
                onClose={() => setSelectedSubmission(null)}
            />
        </div>
    );
}

// Toolbar Component
function Toolbar({
    filterMode,
    setFilterMode,
    onExport,
    totalCount,
    availableVersions,
    selectedVersions,
    onVersionChange,
}: {
    filterMode: FilterMode;
    setFilterMode: (mode: FilterMode) => void;
    onExport: () => void;
    totalCount: number;
    availableVersions: number[];
    selectedVersions: number[];
    onVersionChange: (versions: number[]) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-base-200 bg-base-100">
            <div className="flex items-center gap-4 flex-wrap">
                {/* Version Filter */}
                <VersionFilter
                    versions={availableVersions}
                    selectedVersions={selectedVersions}
                    onVersionChange={onVersionChange}
                />

                {/* Filter Tabs */}
                <div className="flex rounded-lg bg-base-200 p-1">
                    <FilterButton
                        active={filterMode === "all"}
                        onClick={() => setFilterMode("all")}
                        label="All"
                    />
                    <FilterButton
                        active={filterMode === "complete"}
                        onClick={() => setFilterMode("complete")}
                        label="Complete"
                        icon={<LuCircleCheck className="w-3.5 h-3.5" />}
                    />
                    <FilterButton
                        active={filterMode === "partial"}
                        onClick={() => setFilterMode("partial")}
                        label="Partial"
                        icon={<LuClock className="w-3.5 h-3.5" />}
                    />
                </div>

                <span className="text-sm text-base-content/60">
                    {totalCount} {totalCount === 1 ? "response" : "responses"}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {/* Export Button */}
                <button
                    className="btn btn-sm btn-outline gap-2 hover:btn-primary"
                    onClick={onExport}
                    disabled={totalCount === 0}
                >
                    <LuDownload className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    label,
    icon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: React.ReactNode;
}) {
    return (
        <button
            className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"} gap-1.5`}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    );
}

// Empty State Component
function EmptyState({ filterMode }: { filterMode: FilterMode }) {
    const messages = {
        all: {
            title: "No responses yet",
            description: "Share your form to start collecting responses.",
        },
        complete: {
            title: "No complete responses",
            description:
                "Complete responses will appear here when users submit the form.",
        },
        partial: {
            title: "No partial responses",
            description: "Partial responses appear when users leave before submitting.",
        },
    };

    const { title, description } = messages[filterMode];

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                <LuInbox className="w-10 h-10 text-base-content/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-base-content/60 max-w-sm">{description}</p>
        </div>
    );
}
