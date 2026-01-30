"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { publishForm } from "@/actions/form";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { 
    LuArrowLeft, 
    LuLoader, 
    LuCheck, 
    LuCloud, 
    LuCloudOff,
    LuUndo2,
    LuRedo2,
    LuEye,
    LuSettings,
    LuShare2,
    LuPenTool,
    LuChartBar,
    LuRocket,
    LuHistory,
    LuCircleAlert,
} from "react-icons/lu";
import { SaveStatus } from "@/hooks/useAutoSave";
import { motion, AnimatePresence, saveStatusVariants } from "@/lib/animations";
import { VersionHistoryModal } from "./VersionHistoryModal";

type TabType = "build" | "integrate" | "settings" | "share" | "results";

export function BuilderHeader({
    activeTab,
    onTabChange,
    saveStatus,
    lastSavedAt,
    formName,
}: {
    activeTab: "build" | "results";
    onTabChange: (tab: "build" | "results") => void;
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
    formName?: string;
}) {
    const { formId, isPublished, setFormMetadata, hasUnpublishedChanges, currentVersion, setVersionInfo, shareUrl } = useFormBuilder();
    const [loading, startTransition] = useTransition();
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const router = useRouter();
    const { userId } = useAuth();

    const handlePublish = async () => {
        if (!formId || !userId) return;
        startTransition(async () => {
            try {
                const result = await publishForm(formId, userId);
                if (result) {
                    setFormMetadata(
                        result.id, 
                        result.published, 
                        result.share_url,
                        result.style,
                        {
                            currentVersion: result.current_version,
                            hasUnpublishedChanges: result.has_unpublished_changes,
                            publishedAt: result.published_at,
                        }
                    );
                    if (!isPublished) {
                        // First publish
                        alert(`Form Published! Share URL: ${window.location.origin}/submit/${result.share_url}`);
                    } else {
                        alert("Form republished successfully!");
                    }
                }
            } catch (error) {
                console.error("Failed to publish", error);
                alert("Failed to publish form");
            }
        });
    };

    const getStatusText = () => {
        switch (saveStatus) {
            case "saving":
                return "Saving...";
            case "saved":
                return "Saved";
            case "error":
                return "Error saving";
            default:
                return isPublished ? "Published" : "Draft";
        }
    };

    const tabs = [
        { id: "build", label: "Build", icon: LuPenTool },
        { id: "integrate", label: "Integrate", icon: LuRocket, disabled: true },
        { id: "settings", label: "Settings", icon: LuSettings, disabled: true },
        { id: "share", label: "Share", icon: LuShare2, disabled: true },
        { id: "results", label: "Results", icon: LuChartBar },
    ];

    return (
        <div className="bg-base-100 border-b border-base-200 sticky top-0 z-50 shrink-0">
            {/* Single Row - All content on one line */}
            <div className="flex items-center justify-between px-6 py-3">
                {/* Left: Back button and Form name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button 
                        onClick={() => router.push("/dashboard")} 
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Back to dashboard"
                    >
                        <LuArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-xl font-semibold text-base-content truncate">
                            {formName || "Untitled Form"}
                        </h1>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={saveStatus}
                                variants={saveStatusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center gap-1.5 whitespace-nowrap"
                            >
                                {saveStatus === "saving" && (
                                    <LuLoader className="w-3.5 h-3.5 animate-spin text-base-content/60" />
                                )}
                                {saveStatus === "saved" && (
                                    <LuCheck className="w-3.5 h-3.5 text-success" />
                                )}
                                {saveStatus === "error" && (
                                    <LuCloudOff className="w-3.5 h-3.5 text-error" />
                                )}
                                {saveStatus === "idle" && isPublished && (
                                    <LuCloud className="w-3.5 h-3.5 text-base-content/40" />
                                )}
                                <span className={`text-xs font-medium ${
                                    saveStatus === "error" ? "text-error" : 
                                    saveStatus === "saved" ? "text-success" : 
                                    "text-base-content/60"
                                }`}>
                                    {getStatusText()}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Navigation Tabs */}
                <div className="flex items-center justify-center flex-1">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab.id === activeTab;
                            const isDisabled = tab.disabled;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (!isDisabled && (tab.id === "build" || tab.id === "results")) {
                                            onTabChange(tab.id as "build" | "results");
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={`
                                        relative px-4 py-2 flex items-center gap-2 text-sm font-medium
                                        transition-colors rounded-lg
                                        ${isActive 
                                            ? "text-primary bg-primary/10" 
                                            : isDisabled
                                            ? "text-base-content/30 cursor-not-allowed"
                                            : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                    {/* Undo/Redo */}
                    <div className="flex items-center rounded-lg border border-base-300 divide-x divide-base-300">
                        <button 
                            className="btn btn-ghost btn-sm border-0 rounded-r-none"
                            disabled
                            title="Undo"
                        >
                            <LuUndo2 className="w-4 h-4" />
                        </button>
                        <button 
                            className="btn btn-ghost btn-sm border-0 rounded-l-none"
                            disabled
                            title="Redo"
                        >
                            <LuRedo2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Preview */}
                    <button 
                        className="btn btn-ghost btn-sm gap-2"
                        disabled={!isPublished}
                        onClick={() => {
                            if (isPublished && shareUrl) {
                                window.open(`/submit/${shareUrl}`, '_blank');
                            }
                        }}
                        title="Preview form"
                    >
                        <LuEye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>

                    {/* Version History */}
                    {isPublished && currentVersion > 0 && (
                        <button 
                            className="btn btn-ghost btn-sm gap-2"
                            onClick={() => setShowVersionHistory(true)}
                            title="Version history"
                        >
                            <LuHistory className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                {hasUnpublishedChanges ? "Draft" : `v${currentVersion}`}
                            </span>
                        </button>
                    )}

                    {/* Publish / Republish */}
                    <button
                        className={`btn btn-sm gap-2 ${
                            hasUnpublishedChanges 
                                ? "btn-warning" 
                                : isPublished 
                                    ? "btn-ghost" 
                                    : "btn-primary"
                        }`}
                        onClick={handlePublish}
                        disabled={loading}
                    >
                        {loading ? (
                            <LuLoader className="w-4 h-4 animate-spin" />
                        ) : hasUnpublishedChanges ? (
                            <LuCircleAlert className="w-4 h-4" />
                        ) : (
                            <LuRocket className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                            {hasUnpublishedChanges 
                                ? "Republish" 
                                : isPublished 
                                    ? "Published" 
                                    : "Publish"
                            }
                        </span>
                    </button>
                </div>
            </div>

            {/* Version History Modal */}
            <VersionHistoryModal 
                isOpen={showVersionHistory} 
                onClose={() => setShowVersionHistory(false)} 
            />
        </div>
    );
}
