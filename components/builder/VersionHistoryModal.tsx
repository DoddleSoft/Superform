"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { useToast } from "@/context/ToastContext";
import { getFormVersions, restoreFormVersion } from "@/actions/form";
import { FormVersion } from "@/types/form-builder";
import { LuX, LuLoader, LuHistory, LuRotateCcw, LuCheck } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
    const { formId, currentVersion, setSections, setFormStyle, setHasUnpublishedChanges } = useFormBuilder();
    const toast = useToast();
    const [versions, setVersions] = useState<FormVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, startRestoring] = useTransition();

    useEffect(() => {
        if (isOpen && formId) {
            setLoading(true);
            getFormVersions(formId)
                .then((data) => {
                    setVersions(data || []);
                })
                .catch((error) => {
                    console.error("Failed to load versions:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, formId]);

    const handleRestore = async (version: FormVersion) => {
        if (!formId) return;

        startRestoring(async () => {
            try {
                const result = await restoreFormVersion(formId, version.version);
                if (result) {
                    // Update local state with restored content
                    setSections(result.content || []);
                    setFormStyle(result.style || 'classic');
                    setHasUnpublishedChanges(true);
                    onClose();
                    toast.success(`Restored to version ${version.version}. Click Republish to make it live.`);
                }
            } catch (error) {
                console.error("Failed to restore version:", error);
                toast.error("Failed to restore version");
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-base-100 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-base-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <LuHistory className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Version History</h2>
                                <p className="text-sm text-base-content/60">
                                    Published: v{currentVersion}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-sm btn-circle"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <LuLoader className="w-6 h-6 animate-spin text-base-content/40" />
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="text-center py-12 text-base-content/60">
                                <LuHistory className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No versions found</p>
                                <p className="text-sm mt-1">
                                    Versions are created each time you publish
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version) => {
                                    const isCurrent = version.version === currentVersion;
                                    const sectionCount = Array.isArray(version.content) ? version.content.length : 0;
                                    const elementCount = Array.isArray(version.content)
                                        ? version.content.reduce((acc, section) => acc + (section.elements?.length || 0), 0)
                                        : 0;

                                    return (
                                        <div
                                            key={version.id}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                isCurrent
                                                    ? "border-primary bg-primary/5"
                                                    : "border-base-200 hover:border-base-300"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold">
                                                            Version {version.version}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="badge badge-primary badge-sm">
                                                                Published
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-base-content/60 truncate">
                                                        {version.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-base-content/50">
                                                        <span>{formatDate(version.created_at)}</span>
                                                        <span>•</span>
                                                        <span>{sectionCount} sections</span>
                                                        <span>•</span>
                                                        <span>{elementCount} fields</span>
                                                    </div>
                                                </div>
                                                
                                                {!isCurrent && (
                                                    <button
                                                        onClick={() => handleRestore(version)}
                                                        disabled={restoring}
                                                        className="btn btn-ghost btn-sm gap-2"
                                                    >
                                                        {restoring ? (
                                                            <LuLoader className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <LuRotateCcw className="w-4 h-4" />
                                                        )}
                                                        Restore
                                                    </button>
                                                )}
                                                
                                                {isCurrent && (
                                                    <div className="flex items-center gap-1 text-primary">
                                                        <LuCheck className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Live</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-base-200 bg-base-50/50">
                        <p className="text-xs text-base-content/50 text-center">
                            Restore a previous version to load it into your draft. You&apos;ll need to republish to make it live.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
