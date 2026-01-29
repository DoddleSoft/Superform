"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { publishForm, saveFormContent } from "@/actions/form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LuSave, LuGlobe, LuArrowLeft, LuLoader, LuCheck } from "react-icons/lu";
import { AIChatToggleButton } from "./AIChatSidebar";

export function BuilderHeader({
    activeTab,
    onTabChange,
}: {
    activeTab: "build" | "results";
    onTabChange: (tab: "build" | "results") => void;
}) {
    const { elements, formId, isPublished, shareUrl, setFormMetadata } = useFormBuilder();
    const [loading, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (!formId) return;
        setSaved(false);
        startTransition(async () => {
            try {
                await saveFormContent(formId, JSON.stringify(elements));
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } catch (error) {
                console.error("Failed to save", error);
                alert("Failed to save form");
            }
        });
    };

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

    return (
        <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-200 sticky top-0 z-50 h-16 px-4">
            <div className="navbar-start gap-4">
                <button onClick={() => router.push("/dashboard")} className="btn btn-ghost btn-circle btn-sm">
                    <LuArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg">Form Builder</span>
                    <span className="text-xs text-base-content/60">{loading ? "Saving..." : saved ? "All changes saved" : isPublished ? "Published" : "Draft"}</span>
                </div>
            </div>

            <div className="navbar-center">
                <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1">
                    <a
                        role="tab"
                        className={`tab tab-sm transition-all ${activeTab === "build" ? "tab-active bg-white shadow-sm" : ""}`}
                        onClick={() => onTabChange("build")}
                    >
                        Builder
                    </a>
                    <a
                        role="tab"
                        className={`tab tab-sm transition-all ${activeTab === "results" ? "tab-active bg-white shadow-sm" : ""}`}
                        onClick={() => onTabChange("results")}
                    >
                        Results
                    </a>
                </div>
            </div>

            <div className="navbar-end gap-2">
                <AIChatToggleButton />
                <button
                    className="btn btn-ghost btn-sm gap-2"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? <LuLoader className="animate-spin" /> : saved ? <LuCheck className="text-success" /> : <LuSave />}
                    <span className="hidden sm:inline">Save</span>
                </button>
                <button
                    className={`btn btn-sm gap-2 ${isPublished ? "btn-secondary" : "btn-primary"}`}
                    onClick={handlePublish}
                    disabled={loading}
                >
                    <LuGlobe />
                    <span className="hidden sm:inline">{isPublished ? "View Live" : "Publish"}</span>
                </button>
            </div>
        </div>
    );
}
