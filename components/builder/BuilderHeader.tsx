"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { publishForm } from "@/actions/form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuGlobe, LuArrowLeft, LuLoader, LuCheck, LuCloud, LuCloudOff } from "react-icons/lu";
import { SaveStatus } from "@/hooks/useAutoSave";
import { motion, AnimatePresence, saveStatusVariants } from "@/lib/animations";

export function BuilderHeader({
    activeTab,
    onTabChange,
    saveStatus,
    lastSavedAt,
}: {
    activeTab: "build" | "results";
    onTabChange: (tab: "build" | "results") => void;
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
}) {
    const { formId, isPublished, setFormMetadata } = useFormBuilder();
    const [loading, startTransition] = useTransition();
    const router = useRouter();

    const handlePublish = async () => {
        if (!formId) return;
        startTransition(async () => {
            try {
                const result = await publishForm(formId);
                if (result) {
                    setFormMetadata(result.id, result.published, result.share_url);
                    alert(`Form Published! Share URL: ${window.location.origin}/submit/${result.share_url}`);
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

    return (
        <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-200 sticky top-0 z-50 h-16 px-4 shrink-0">
            <div className="navbar-start gap-4">
                <button onClick={() => router.push("/dashboard")} className="btn btn-ghost btn-circle btn-sm">
                    <LuArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg">Form Builder</span>
                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={saveStatus}
                                variants={saveStatusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center gap-1.5"
                            >
                                {saveStatus === "saving" && (
                                    <LuLoader className="w-3 h-3 animate-spin text-base-content/60" />
                                )}
                                {saveStatus === "saved" && (
                                    <LuCheck className="w-3 h-3 text-success" />
                                )}
                                {saveStatus === "error" && (
                                    <LuCloudOff className="w-3 h-3 text-error" />
                                )}
                                {saveStatus === "idle" && (
                                    <LuCloud className="w-3 h-3 text-base-content/40" />
                                )}
                                <span className={`text-xs ${
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
            </div>

            <div className="navbar-center">
                <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1">
                    <button
                        role="tab"
                        className={`tab tab-sm transition-all ${activeTab === "build" ? "tab-active bg-white shadow-sm" : ""}`}
                        onClick={() => onTabChange("build")}
                    >
                        Builder
                    </button>
                    <button
                        role="tab"
                        className={`tab tab-sm transition-all ${activeTab === "results" ? "tab-active bg-white shadow-sm" : ""}`}
                        onClick={() => onTabChange("results")}
                    >
                        Results
                    </button>
                </div>
            </div>

            <div className="navbar-end gap-2">
                <button
                    className={`btn btn-sm gap-2 ${isPublished ? "btn-secondary" : "btn-primary"}`}
                    onClick={handlePublish}
                    disabled={loading}
                >
                    {loading ? <LuLoader className="animate-spin" /> : <LuGlobe />}
                    <span className="hidden sm:inline">{isPublished ? "View Live" : "Publish"}</span>
                </button>
            </div>
        </div>
    );
}
