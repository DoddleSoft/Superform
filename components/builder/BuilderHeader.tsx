"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { publishForm, saveFormContent } from "@/actions/form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

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
                // Assume result contains updated published state and share_url
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
        <div className="flex justify-between items-center p-4 border-b border-base-300 bg-base-100 h-16">
            <div className="flex items-center gap-4 w-1/4">
                <a href="/dashboard" className="btn btn-ghost btn-sm">
                    &larr; Back
                </a>
                <h1 className="font-bold text-xl truncate">Form Builder</h1>
            </div>

            <div className="flex justify-center flex-1">
                <div role="tablist" className="tabs tabs-boxed">
                    <a
                        role="tab"
                        className={`tab ${activeTab === "build" ? "tab-active" : ""}`}
                        onClick={() => onTabChange("build")}
                    >
                        Build
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "results" ? "tab-active" : ""}`}
                        onClick={() => onTabChange("results")}
                    >
                        Results
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-2 w-1/4 justify-end">
                <div className="text-sm text-base-content/60 mr-2">
                    {loading ? "Saving..." : saved ? "Saved!" : ""}
                </div>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Save
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handlePublish}
                    disabled={loading}
                >
                    {isPublished ? "View Public Form" : "Publish"}
                </button>
            </div>
        </div>
    );
}
