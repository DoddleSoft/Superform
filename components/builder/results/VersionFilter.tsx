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
            <summary className="flex items-center gap-2 px-3 py-1.5 bg-base-200/80 hover:bg-base-200 rounded-full text-sm font-medium text-base-content/70 cursor-pointer transition-colors">
                <LuFilter className="w-3.5 h-3.5" />
                <span>{getDisplayText()}</span>
                <LuChevronDown className="w-3 h-3 text-base-content/40" />
            </summary>
            <ul className="dropdown-content z-50 mt-2 p-1.5 shadow-lg bg-base-100 rounded-xl border border-base-200 w-48">
                {/* All Versions Option */}
                <li>
                    <button
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isAllSelected ? "bg-primary/10 text-primary" : "hover:bg-base-200 text-base-content"
                        }`}
                        onClick={handleSelectAll}
                    >
                        <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                isAllSelected
                                    ? "bg-primary text-primary-content"
                                    : "border border-base-300"
                            }`}
                        >
                            {isAllSelected && <LuCheck className="w-2.5 h-2.5" />}
                        </div>
                        <span className="flex-1 text-left">All Versions</span>
                        <span className="text-xs text-base-content/40 bg-base-200 px-1.5 py-0.5 rounded">{versions.length}</span>
                    </button>
                </li>

                <li className="my-1 border-t border-base-200"></li>

                {/* Individual Versions */}
                {sortedVersions.map((version) => {
                    const isSelected = !isAllSelected && selectedVersions.includes(version);
                    return (
                        <li key={version}>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-base-200 text-base-content"
                                }`}
                                onClick={() => handleToggleVersion(version)}
                            >
                                <div
                                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? "bg-primary text-primary-content"
                                            : "border border-base-300"
                                    }`}
                                >
                                    {isSelected && <LuCheck className="w-2.5 h-2.5" />}
                                </div>
                                <span className="flex-1 text-left">Version {version}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </details>
    );
}
