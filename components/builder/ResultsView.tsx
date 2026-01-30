"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType, FormSection } from "@/types/form-builder";
import { FormSubmission, SubmissionWithProgress, calculateSubmissionProgress, calculateSubmissionStats } from "@/types/submission";
import React, { useMemo, useState } from "react";
import { FormElements } from "./FormElements";
import { motion, AnimatePresence } from "framer-motion";
import {
    LuCheck,
    LuClock,
    LuDownload,
    LuEye,
    LuChartPie,
    LuTable,
    LuX,
    LuChevronDown,
    LuChevronUp,
    LuCircleAlert,
    LuCircleCheck,
    LuUsers,
    LuTrendingUp,
    LuChartBar,
    LuArchive,
} from "react-icons/lu";

type ViewMode = "table" | "cards";
type FilterMode = "all" | "complete" | "partial";

interface Column {
    id: string;
    label: string;
    type: FormElementType;
    isDeleted?: boolean; // Mark fields that are no longer in the current form
}

// Helper to extract columns from a sections array (current form or snapshot)
function extractColumnsFromSections(sections: FormSection[]): Column[] {
    const cols: Column[] = [];
    const allElements = sections.flatMap(section => section.elements);
    
    allElements.forEach((element) => {
        switch (element.type) {
            case FormElementType.TEXT_FIELD:
            case FormElementType.NUMBER:
            case FormElementType.TEXTAREA:
            case FormElementType.DATE:
            case FormElementType.CHECKBOX:
            case FormElementType.SELECT:
                cols.push({
                    id: element.id,
                    label: element.extraAttributes?.label || FormElements[element.type]?.label || "Field",
                    type: element.type,
                });
                break;
        }
    });
    return cols;
}

// Get the label for a field from a submission's snapshot, or fall back to current columns
function getFieldLabelFromSubmission(fieldId: string, submission: FormSubmission, currentColumns: Column[]): string {
    // First try to get from snapshot
    if (submission.form_content_snapshot) {
        const snapshotCols = extractColumnsFromSections(submission.form_content_snapshot);
        const snapshotCol = snapshotCols.find(c => c.id === fieldId);
        if (snapshotCol) {
            return snapshotCol.label;
        }
    }
    // Fall back to current columns
    const currentCol = currentColumns.find(c => c.id === fieldId);
    return currentCol?.label || "Unknown Field";
}

export function ResultsView({ submissions }: { submissions: FormSubmission[] }) {
    const { sections } = useFormBuilder();
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithProgress | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Get current form columns
    const currentColumns: Column[] = useMemo(() => {
        return extractColumnsFromSections(sections);
    }, [sections]);

    // Merge columns: current form + any deleted fields from snapshots
    // This ensures we can display responses for fields that were later deleted
    const columns: Column[] = useMemo(() => {
        const columnMap = new Map<string, Column>();
        
        // Add current columns first
        currentColumns.forEach(col => {
            columnMap.set(col.id, col);
        });
        
        // Check all submissions with snapshots for additional fields
        submissions.forEach(submission => {
            if (submission.form_content_snapshot) {
                const snapshotCols = extractColumnsFromSections(submission.form_content_snapshot);
                snapshotCols.forEach(col => {
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
    }, [currentColumns, submissions]);

    // Process submissions with progress
    const processedSubmissions: SubmissionWithProgress[] = useMemo(() => {
        return submissions.map(sub => calculateSubmissionProgress(sub, columns.length));
    }, [submissions, columns.length]);

    // Filter submissions based on mode
    const filteredSubmissions = useMemo(() => {
        switch (filterMode) {
            case "complete":
                return processedSubmissions.filter(s => s.is_complete);
            case "partial":
                return processedSubmissions.filter(s => !s.is_complete);
            default:
                return processedSubmissions;
        }
    }, [processedSubmissions, filterMode]);

    // Calculate stats
    const stats = useMemo(() => {
        return calculateSubmissionStats(submissions, columns.length);
    }, [submissions, columns.length]);

    const toggleRowExpanded = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const exportToCSV = () => {
        const headers = [...columns.map(c => c.label), "Status", "Progress", "Submitted At"];
        const rows = filteredSubmissions.map(sub => {
            const values = columns.map(col => {
                const value = sub.data?.[col.id] || "";
                // Escape quotes and wrap in quotes if contains comma
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            return [
                ...values,
                sub.is_complete ? "Complete" : "Partial",
                `${sub.progress}%`,
                new Date(sub.created_at).toLocaleString(),
            ].join(",");
        });
        
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `submissions-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full w-full bg-base-100">
            {/* Stats Header */}
            <StatsHeader stats={stats} />

            {/* Toolbar */}
            <Toolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                onExport={exportToCSV}
                totalCount={filteredSubmissions.length}
            />

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {filteredSubmissions.length === 0 ? (
                    <EmptyState filterMode={filterMode} />
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === "table" ? (
                            <TableView
                                key="table"
                                submissions={filteredSubmissions}
                                columns={columns}
                                expandedRows={expandedRows}
                                toggleRowExpanded={toggleRowExpanded}
                                onViewDetails={setSelectedSubmission}
                            />
                        ) : (
                            <CardsView
                                key="cards"
                                submissions={filteredSubmissions}
                                columns={columns}
                                onViewDetails={setSelectedSubmission}
                            />
                        )}
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

// Stats Header Component
function StatsHeader({ stats }: { stats: ReturnType<typeof calculateSubmissionStats> }) {
    return (
        <div className="bg-base-200 border-b border-base-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                <StatCard
                    icon={<LuUsers className="w-5 h-5" />}
                    label="Total Responses"
                    value={stats.totalSubmissions}
                    color="primary"
                />
                <StatCard
                    icon={<LuCircleCheck className="w-5 h-5" />}
                    label="Complete"
                    value={stats.completeSubmissions}
                    color="success"
                />
                <StatCard
                    icon={<LuClock className="w-5 h-5" />}
                    label="Partial"
                    value={stats.partialSubmissions}
                    color="warning"
                />
                <StatCard
                    icon={<LuTrendingUp className="w-5 h-5" />}
                    label="Completion Rate"
                    value={`${stats.completionRate}%`}
                    color="info"
                    subtext={stats.partialSubmissions > 0 ? `Avg. partial: ${stats.averageCompletionPercentage}%` : undefined}
                />
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
    subtext,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: "primary" | "success" | "warning" | "info";
    subtext?: string;
}) {
    const colorClasses = {
        primary: "text-primary bg-primary/10",
        success: "text-success bg-success/10",
        warning: "text-warning bg-warning/10",
        info: "text-info bg-info/10",
    };

    return (
        <div className="bg-base-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-base-content/60">{label}</p>
                    {subtext && (
                        <p className="text-xs text-base-content/40 mt-0.5">{subtext}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Toolbar Component
function Toolbar({
    viewMode,
    setViewMode,
    filterMode,
    setFilterMode,
    onExport,
    totalCount,
}: {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    filterMode: FilterMode;
    setFilterMode: (mode: FilterMode) => void;
    onExport: () => void;
    totalCount: number;
}) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
            <div className="flex items-center gap-4">
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
                {/* View Toggle */}
                <div className="flex rounded-lg bg-base-200 p-1">
                    <button
                        className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setViewMode("table")}
                        title="Table View"
                    >
                        <LuTable className="w-4 h-4" />
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === "cards" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setViewMode("cards")}
                        title="Card View"
                    >
                        <LuChartBar className="w-4 h-4" />
                    </button>
                </div>

                {/* Export Button */}
                <button
                    className="btn btn-sm btn-outline gap-2"
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

// Table View Component
function TableView({
    submissions,
    columns,
    expandedRows,
    toggleRowExpanded,
    onViewDetails,
}: {
    submissions: SubmissionWithProgress[];
    columns: Column[];
    expandedRows: Set<string>;
    toggleRowExpanded: (id: string) => void;
    onViewDetails: (submission: SubmissionWithProgress) => void;
}) {
    // Show max 4 columns in table, rest in expanded view
    const visibleColumns = columns.slice(0, 4);
    const hiddenColumns = columns.slice(4);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-auto h-full"
        >
            <table className="table table-pin-rows">
                <thead>
                    <tr className="bg-base-100">
                        <th className="w-12"></th>
                        <th className="w-28">Status</th>
                        {visibleColumns.map((col) => (
                            <th key={col.id} className="max-w-[200px]">
                                <span className={`flex items-center gap-1.5 ${col.isDeleted ? 'text-base-content/50' : ''}`}>
                                    {col.isDeleted && (
                                        <LuArchive className="w-3 h-3" title="Deleted field" />
                                    )}
                                    {col.label}
                                </span>
                            </th>
                        ))}
                        {hiddenColumns.length > 0 && (
                            <th className="w-32">+{hiddenColumns.length} more</th>
                        )}
                        <th className="w-40">Submitted</th>
                        <th className="w-20"></th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((submission) => (
                        <React.Fragment key={submission.id}>
                            <tr
                                className={`hover:bg-base-200/50 cursor-pointer transition-colors ${
                                    !submission.is_complete ? "bg-warning/5" : ""
                                }`}
                                onClick={() => toggleRowExpanded(submission.id)}
                            >
                                <td>
                                    <button className="btn btn-ghost btn-xs btn-circle">
                                        {expandedRows.has(submission.id) ? (
                                            <LuChevronUp className="w-4 h-4" />
                                        ) : (
                                            <LuChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </td>
                                <td>
                                    <StatusBadge
                                        isComplete={submission.is_complete}
                                        progress={submission.progress}
                                    />
                                </td>
                                {visibleColumns.map((col) => (
                                    <td key={col.id} className="max-w-[200px] truncate">
                                        <CellValue
                                            value={submission.data?.[col.id]}
                                            type={col.type}
                                        />
                                    </td>
                                ))}
                                {hiddenColumns.length > 0 && (
                                    <td className="text-base-content/50 text-sm">
                                        {hiddenColumns.filter(c => submission.data?.[c.id]).length} answered
                                    </td>
                                )}
                                <td className="text-base-content/60 text-sm">
                                    <TimeDisplay date={submission.created_at} />
                                </td>
                                <td>
                                    <button
                                        className="btn btn-ghost btn-xs gap-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails(submission);
                                        }}
                                    >
                                        <LuEye className="w-3.5 h-3.5" />
                                        View
                                    </button>
                                </td>
                            </tr>
                            <AnimatePresence>
                                {expandedRows.has(submission.id) && hiddenColumns.length > 0 && (
                                    <motion.tr
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-base-200/30"
                                    >
                                        <td colSpan={visibleColumns.length + 5}>
                                            <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {hiddenColumns.map((col) => (
                                                    <div key={col.id}>
                                                        <p className="text-xs text-base-content/50 mb-1">
                                                            {col.label}
                                                        </p>
                                                        <CellValue
                                                            value={submission.data?.[col.id]}
                                                            type={col.type}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );
}

// Cards View Component
function CardsView({
    submissions,
    columns,
    onViewDetails,
}: {
    submissions: SubmissionWithProgress[];
    columns: Column[];
    onViewDetails: (submission: SubmissionWithProgress) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-auto h-full p-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissions.map((submission) => (
                    <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        columns={columns}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>
        </motion.div>
    );
}

function SubmissionCard({
    submission,
    columns,
    onViewDetails,
}: {
    submission: SubmissionWithProgress;
    columns: Column[];
    onViewDetails: (submission: SubmissionWithProgress) => void;
}) {
    const previewColumns = columns.slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-base-100 rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                submission.is_complete ? "border-base-200" : "border-warning/30"
            }`}
        >
            {/* Progress Bar */}
            <div className="h-1.5 bg-base-200">
                <div
                    className={`h-full transition-all ${
                        submission.is_complete ? "bg-success" : "bg-warning"
                    }`}
                    style={{ width: `${submission.progress}%` }}
                />
            </div>

            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <StatusBadge
                        isComplete={submission.is_complete}
                        progress={submission.progress}
                    />
                    <TimeDisplay date={submission.created_at} />
                </div>

                {/* Preview Fields */}
                <div className="space-y-3">
                    {previewColumns.map((col) => (
                        <div key={col.id}>
                            <p className="text-xs text-base-content/50 mb-0.5">
                                {col.label}
                            </p>
                            <p className="text-sm truncate">
                                <CellValue
                                    value={submission.data?.[col.id]}
                                    type={col.type}
                                />
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between">
                    <span className="text-xs text-base-content/50">
                        {submission.answeredFields}/{submission.totalFields} fields answered
                    </span>
                    <button
                        className="btn btn-sm btn-ghost gap-1"
                        onClick={() => onViewDetails(submission)}
                    >
                        <LuEye className="w-3.5 h-3.5" />
                        Details
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Status Badge Component
function StatusBadge({
    isComplete,
    progress,
}: {
    isComplete: boolean;
    progress: number;
}) {
    if (isComplete) {
        return (
            <span className="badge badge-success gap-1.5">
                <LuCircleCheck className="w-3 h-3" />
                Complete
            </span>
        );
    }

    return (
        <span className="badge badge-warning gap-1.5">
            <LuClock className="w-3 h-3" />
            Partial ({progress}%)
        </span>
    );
}

// Cell Value Formatter
function CellValue({ value, type }: { value: any; type: FormElementType }) {
    if (value === undefined || value === null || value === "") {
        return <span className="text-base-content/30 italic">—</span>;
    }

    switch (type) {
        case FormElementType.CHECKBOX:
            return value === "true" || value === true ? (
                <LuCheck className="w-4 h-4 text-success" />
            ) : (
                <LuX className="w-4 h-4 text-base-content/30" />
            );
        case FormElementType.DATE:
            return (
                <span>{new Date(value).toLocaleDateString()}</span>
            );
        default:
            return <span>{String(value)}</span>;
    }
}

// Time Display Component
function TimeDisplay({ date }: { date: string }) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative: string;
    if (diffMins < 1) {
        relative = "Just now";
    } else if (diffMins < 60) {
        relative = `${diffMins}m ago`;
    } else if (diffHours < 24) {
        relative = `${diffHours}h ago`;
    } else if (diffDays < 7) {
        relative = `${diffDays}d ago`;
    } else {
        relative = d.toLocaleDateString();
    }

    return (
        <span className="text-xs text-base-content/50" title={d.toLocaleString()}>
            {relative}
        </span>
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
            description: "Complete responses will appear here when users submit the form.",
        },
        partial: {
            title: "No partial responses",
            description: "Partial responses appear when users leave before submitting.",
        },
    };

    const { title, description } = messages[filterMode];

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <LuChartPie className="w-8 h-8 text-base-content/30" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-base-content/60 max-w-sm">{description}</p>
        </div>
    );
}

// Submission Detail Modal
function SubmissionDetailModal({
    submission,
    columns,
    onClose,
}: {
    submission: SubmissionWithProgress | null;
    columns: Column[];
    onClose: () => void;
}) {
    if (!submission) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-base-200">
                        <div>
                            <h2 className="text-xl font-bold">Response Details</h2>
                            <p className="text-sm text-base-content/60">
                                Submitted {new Date(submission.created_at).toLocaleString()}
                            </p>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            onClick={onClose}
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Overview */}
                    <div className="px-6 py-4 bg-base-200/50 border-b border-base-200">
                        <div className="flex items-center gap-4">
                            <StatusBadge
                                isComplete={submission.is_complete}
                                progress={submission.progress}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-base-content/60">
                                        {submission.answeredFields} of {submission.totalFields} fields answered
                                    </span>
                                    <span className="text-sm font-medium">
                                        {submission.progress}%
                                    </span>
                                </div>
                                <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            submission.is_complete ? "bg-success" : "bg-warning"
                                        }`}
                                        style={{ width: `${submission.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="p-6 overflow-y-auto max-h-[50vh]">
                        <div className="space-y-4">
                            {columns.map((col) => {
                                const value = submission.data?.[col.id];
                                const hasValue = value !== undefined && value !== null && value !== "";

                                return (
                                    <div
                                        key={col.id}
                                        className={`p-4 rounded-lg border ${
                                            col.isDeleted
                                                ? "border-warning/30 bg-warning/5"
                                                : hasValue
                                                    ? "border-base-200 bg-base-100"
                                                    : "border-dashed border-base-300 bg-base-200/30"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium mb-1 flex items-center gap-1.5 ${col.isDeleted ? 'text-warning' : 'text-base-content/70'}`}>
                                                    {col.isDeleted && (
                                                        <LuArchive className="w-3.5 h-3.5" />
                                                    )}
                                                    {col.label}
                                                    {col.isDeleted && (
                                                        <span className="text-xs font-normal">(deleted)</span>
                                                    )}
                                                </p>
                                                {hasValue ? (
                                                    <div className="text-base">
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
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-base-200">
                        <button className="btn btn-ghost" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}