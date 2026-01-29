"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance, FormElementType } from "@/types/form-builder";
import React from "react";
import { FormElements } from "./FormElements";

export function ResultsView({ submissions }: { submissions: any[] }) {
    const { elements } = useFormBuilder();

    // Map columns from form elements
    const columns: { id: string; label: string; type: FormElementType }[] = [];

    elements.forEach((element) => {
        switch (element.type) {
            case FormElementType.TEXT_FIELD:
            case FormElementType.NUMBER:
            case FormElementType.TEXTAREA:
            case FormElementType.DATE:
            case FormElementType.CHECKBOX:
            case FormElementType.SELECT:
                columns.push({
                    id: element.id,
                    label: element.extraAttributes?.label || FormElements[element.type]?.label || "Field",
                    type: element.type,
                });
                break;
            default:
                break;
        }
    });

    return (
        <div className="flex flex-col h-full w-full bg-base-100 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Submissions</h2>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.id}>{col.label}</th>
                            ))}
                            <th>Submitted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((row) => (
                            <tr key={row.id}>
                                {columns.map((col) => {
                                    const value = row.data[col.id];
                                    return <td key={col.id}>{value}</td>;
                                })}
                                <td className="text-muted-foreground text-xs">
                                    {new Date(row.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {submissions.length === 0 && (
                    <div className="text-center p-8 text-base-content/60">
                        No submissions yet.
                    </div>
                )}
            </div>
        </div>
    );
}
