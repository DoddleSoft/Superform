"use client";

import React, { useRef, useEffect } from "react";
import { LuCheck, LuChevronDown, LuFilter } from "react-icons/lu";

interface VersionFilterProps {
    versions: number[];
    selectedVersions: number[];
    onVersionChange: (versions: number[]) => void;
}

export function VersionFilter({
    versions,
    selectedVersions,
    onVersionChange,
}: VersionFilterProps) {
    const dropdownRef = useRef<HTMLDetailsElement>(null);

    // Sort versions in descending order (newest first)
    const sortedVersions = [...versions].sort((a, b) => b - a);

    const isAllSelected = selectedVersions.length === 0 || selectedVersions.length === versions.length;

    const handleSelectAll = () => {
        onVersionChange([]);
    };

    const handleToggleVersion = (version: number) => {
        if (isAllSelected) {
            // If "All" is selected, clicking a version selects only that version
            onVersionChange([version]);
        } else if (selectedVersions.includes(version)) {
            // Remove version
            const newVersions = selectedVersions.filter((v) => v !== version);
            // If no versions left, select all
            if (newVersions.length === 0) {
                onVersionChange([]);
            } else {
                onVersionChange(newVersions);
            }
        } else {
            // Add version
            const newVersions = [...selectedVersions, version];
            // If all versions selected, switch to "All"
            if (newVersions.length === versions.length) {
                onVersionChange([]);
            } else {
                onVersionChange(newVersions);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                dropdownRef.current.removeAttribute("open");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDisplayText = () => {
        if (isAllSelected) {
            return "All Versions";
        }
        if (selectedVersions.length === 1) {
            return `Version ${selectedVersions[0]}`;
        }
        return `${selectedVersions.length} versions`;
    };

    if (versions.length <= 1) {
        // Don't show filter if only one version exists
        return null;
    }

    return (
        <details ref={dropdownRef} className="dropdown">
            <summary className="btn btn-sm btn-ghost gap-2 bg-base-200 hover:bg-base-300">
                <LuFilter className="w-4 h-4" />
                <span>{getDisplayText()}</span>
                <LuChevronDown className="w-3.5 h-3.5" />
            </summary>
            <ul className="dropdown-content z-50 menu mt-2 p-2 shadow-lg bg-base-100 rounded-xl border border-base-200 w-52">
                {/* All Versions Option */}
                <li>
                    <button
                        className={`flex items-center gap-3 ${isAllSelected ? "active" : ""}`}
                        onClick={handleSelectAll}
                    >
                        <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isAllSelected
                                    ? "bg-primary border-primary text-primary-content"
                                    : "border-base-300"
                            }`}
                        >
                            {isAllSelected && <LuCheck className="w-3 h-3" />}
                        </div>
                        <span className="flex-1">All Versions</span>
                        <span className="badge badge-sm badge-ghost">{versions.length}</span>
                    </button>
                </li>

                <li className="divider my-1"></li>

                {/* Individual Versions */}
                {sortedVersions.map((version) => {
                    const isSelected = !isAllSelected && selectedVersions.includes(version);
                    return (
                        <li key={version}>
                            <button
                                className={`flex items-center gap-3 ${isSelected ? "active" : ""}`}
                                onClick={() => handleToggleVersion(version)}
                            >
                                <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        isSelected
                                            ? "bg-primary border-primary text-primary-content"
                                            : "border-base-300"
                                    }`}
                                >
                                    {isSelected && <LuCheck className="w-3 h-3" />}
                                </div>
                                <span className="flex-1">Version {version}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </details>
    );
}
