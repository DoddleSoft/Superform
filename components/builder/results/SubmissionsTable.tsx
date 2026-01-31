"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import {
    LuCheck,
    LuClock,
    LuX,
    LuArchive,
    LuCircleCheck,
} from "react-icons/lu";
import { FormElementType } from "@/types/form-builder";
import { SubmissionWithProgress } from "@/types/submission";

export interface Column {
    id: string;
    label: string;
    type: FormElementType;
    isDeleted?: boolean;
}

interface SubmissionsTableProps {
    submissions: SubmissionWithProgress[];
    columns: Column[];
    onRowClick: (submission: SubmissionWithProgress) => void;
}

const columnHelper = createColumnHelper<SubmissionWithProgress>();

export function SubmissionsTable({
    submissions,
    columns,
    onRowClick,
}: SubmissionsTableProps) {
    const tableColumns = useMemo(() => {
        return [
            columnHelper.accessor("created_at", {
                header: "Submitted",
                cell: (info) => <TimeDisplay date={info.getValue()} />,
                size: 140,
                meta: {
                    sticky: "left",
                },
            }),
            columnHelper.accessor(
                (row) => ({
                    isComplete: row.is_complete,
                    progress: row.progress,
                }),
                {
                    id: "status",
                    header: "Status",
                    cell: (info) => {
                        const { isComplete, progress } = info.getValue();
                        return (
                            <StatusBadge
                                isComplete={isComplete}
                                progress={progress}
                            />
                        );
                    },
                    size: 100,
                }
            ),
            columnHelper.accessor("form_version", {
                header: "Version",
                cell: (info) => <VersionBadge version={info.getValue()} />,
                size: 80,
            }),
            ...columns.map((col) =>
                columnHelper.accessor((row) => row.data?.[col.id], {
                    id: col.id,
                    header: () => (
                        <span
                            className={`flex items-center gap-1.5 ${col.isDeleted ? "text-base-content/50" : ""
                                }`}
                        >
                            {col.isDeleted && (
                                <LuArchive
                                    className="w-3 h-3 shrink-0"
                                    title="Deleted field"
                                />
                            )}
                            <span className="truncate">{col.label}</span>
                        </span>
                    ),
                    cell: (info) => (
                        <div className="truncate">
                            <CellValue value={info.getValue()} type={col.type} />
                        </div>
                    ),
                    size: 200,
                })
            ),
        ];
    }, [columns]);

    const table = useReactTable({
        data: submissions,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full bg-base-100"
        >
            {/* Outer container handles vertical scroll */}
            <div className="h-full w-full overflow-y-auto">
                {/* Inner container handles horizontal scroll */}
                <div className="min-w-full overflow-x-auto">
                    <table className="table border-separate border-spacing-0" style={{ minWidth: 'max-content' }}>
                        <thead className="sticky top-0 z-20">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Custom sticky logic for the first column
                                    const isSticky =
                                        header.column.columnDef.meta &&
                                        (header.column.columnDef.meta as any)
                                            .sticky === "left";
                                    return (
                                        <th
                                            key={header.id}
                                            className={`bg-base-100 border-b-2 border-base-200 text-xs font-semibold text-base-content/60 uppercase tracking-wider py-3 px-4 ${isSticky
                                                ? "sticky left-0 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                                                : ""
                                                }`}
                                            style={{
                                                width: header.getSize(),
                                                minWidth: header.getSize(),
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="hover:bg-base-50 cursor-pointer transition-colors group"
                                onClick={() => onRowClick(row.original)}
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const isSticky =
                                        cell.column.columnDef.meta &&
                                        (cell.column.columnDef.meta as any)
                                            .sticky === "left";
                                    return (
                                        <td
                                            key={cell.id}
                                            className={`border-b border-base-100 py-3 px-4 text-sm group-hover:bg-base-50 transition-colors ${isSticky
                                                ? "sticky left-0 z-10 bg-base-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                                                : ""
                                                }`}
                                            style={{
                                                width: cell.column.getSize(),
                                                minWidth: cell.column.getSize(),
                                                maxWidth: 400, // Ensure content doesn't blow out
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                <LuCircleCheck className="w-3 h-3" />
                Complete
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
            <LuClock className="w-3 h-3" />
            {progress}%
        </span>
    );
}

// Version Badge Component
function VersionBadge({ version }: { version?: number }) {
    if (!version) {
        return <span className="text-base-content/30 text-sm">—</span>;
    }

    return (
        <span className="inline-flex items-center px-2 py-0.5 bg-base-200 text-base-content/70 text-xs font-medium rounded-md">
            v{version}
        </span>
    );
}

// Cell Value Formatter
function CellValue({ value, type }: { value: any; type: FormElementType }) {
    if (value === undefined || value === null || value === "") {
        return <span className="text-base-content/30">—</span>;
    }

    switch (type) {
        case FormElementType.CHECKBOX:
            return value === "true" || value === true ? (
                <LuCheck className="w-4 h-4 text-success" />
            ) : (
                <LuX className="w-4 h-4 text-base-content/30" />
            );
        case FormElementType.DATE:
            return <span>{new Date(value).toLocaleDateString()}</span>;
        default:
            return <span className="text-sm">{String(value)}</span>;
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
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-base-content">{relative}</span>
            <span className="text-xs text-base-content/40">
                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}

// Export components for reuse
export { StatusBadge, VersionBadge, CellValue, TimeDisplay };
