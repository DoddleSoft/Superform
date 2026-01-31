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
import { DEFAULT_DESIGN_SETTINGS } from "@/types/form-builder";

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
                        result.design_settings ? { ...DEFAULT_DESIGN_SETTINGS, ...result.design_settings } : DEFAULT_DESIGN_SETTINGS,
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
            <div className="flex items-center justify-between px-4 h-14">
                {/* Left: Back button and Form name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                        onClick={() => router.push("/dashboard")} 
                        className="p-2 rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                        title="Back to dashboard"
                    >
                        <LuArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="h-5 w-px bg-base-200" />
                    
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h1 className="text-base font-semibold text-base-content truncate max-w-[200px]">
                            {formName || "Untitled Form"}
                        </h1>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={saveStatus}
                                variants={saveStatusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                    saveStatus === "error" 
                                        ? "bg-error/10 text-error" 
                                        : saveStatus === "saving" 
                                            ? "bg-base-200 text-base-content/60" 
                                            : saveStatus === "saved" 
                                                ? "bg-success/10 text-success" 
                                                : "bg-base-200 text-base-content/50"
                                }`}
                            >
                                {saveStatus === "saving" && (
                                    <LuLoader className="w-3 h-3 animate-spin" />
                                )}
                                {saveStatus === "saved" && (
                                    <LuCheck className="w-3 h-3" />
                                )}
                                {saveStatus === "error" && (
                                    <LuCloudOff className="w-3 h-3" />
                                )}
                                {saveStatus === "idle" && isPublished && (
                                    <LuCloud className="w-3 h-3" />
                                )}
                                {getStatusText()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Navigation Tabs - Pill Style */}
                <div className="flex items-center justify-center flex-1">
                    <div className="inline-flex items-center bg-base-200/80 rounded-full p-1 gap-0.5">
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
                                        flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium
                                        rounded-full transition-all duration-200
                                        ${isActive 
                                            ? "bg-base-100 text-base-content shadow-sm" 
                                            : isDisabled
                                            ? "text-base-content/25 cursor-not-allowed"
                                            : "text-base-content/50 hover:text-base-content hover:bg-base-100/50"
                                        }
                                    `}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {/* Undo/Redo */}
                    <div className="hidden sm:flex items-center bg-base-200/60 rounded-lg p-0.5">
                        <button 
                            className="p-1.5 rounded-md text-base-content/30 cursor-not-allowed"
                            disabled
                            title="Undo (coming soon)"
                        >
                            <LuUndo2 className="w-4 h-4" />
                        </button>
                        <button 
                            className="p-1.5 rounded-md text-base-content/30 cursor-not-allowed"
                            disabled
                            title="Redo (coming soon)"
                        >
                            <LuRedo2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="hidden sm:block h-5 w-px bg-base-200" />

                    {/* Preview */}
                    <button 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isPublished 
                                ? "text-base-content/70 hover:text-base-content hover:bg-base-200" 
                                : "text-base-content/30 cursor-not-allowed"
                        }`}
                        disabled={!isPublished}
                        onClick={() => {
                            if (isPublished && shareUrl) {
                                window.open(`/submit/${shareUrl}`, '_blank');
                            }
                        }}
                        title="Preview form"
                    >
                        <LuEye className="w-4 h-4" />
                        <span className="hidden md:inline">Preview</span>
                    </button>

                    {/* Version History */}
                    {isPublished && currentVersion > 0 && (
                        <button 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={() => setShowVersionHistory(true)}
                            title="Version history"
                        >
                            <LuHistory className="w-4 h-4" />
                            <span className="hidden md:inline">
                                {hasUnpublishedChanges ? "Draft" : `v${currentVersion}`}
                            </span>
                        </button>
                    )}

                    {/* Publish / Republish */}
                    <button
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            loading 
                                ? "bg-base-200 text-base-content/50 cursor-wait"
                                : hasUnpublishedChanges 
                                    ? "bg-warning text-warning-content hover:bg-warning/90 shadow-sm" 
                                    : isPublished 
                                        ? "bg-base-200 text-base-content/70 hover:bg-base-300" 
                                        : "bg-primary text-primary-content hover:bg-primary/90 shadow-sm"
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
                        <span>
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
