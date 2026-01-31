"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { motion } from "@/lib/animations";
import { 
    LuLink, 
    LuCheck, 
    LuX, 
    LuLoader, 
    LuCopy,
    LuExternalLink,
    LuInfo,
    LuSettings,
    LuBell,
    LuShield,
    LuPalette,
} from "react-icons/lu";
import { checkShortCodeAvailability, updateFormShortCode } from "@/actions/form";
import { useToast } from "@/context/ToastContext";

type SettingsSection = "link" | "notifications" | "access" | "advanced";

interface SettingsSidebarItem {
    id: SettingsSection;
    label: string;
    icon: React.ElementType;
    description: string;
}

const settingsSections: SettingsSidebarItem[] = [
    { id: "link", label: "Link Settings", icon: LuLink, description: "Custom URL & social sharing" },
    { id: "notifications", label: "Notifications", icon: LuBell, description: "Email & webhook alerts" },
    { id: "access", label: "Access Control", icon: LuShield, description: "Who can view your form" },
    { id: "advanced", label: "Advanced", icon: LuSettings, description: "Additional options" },
];

export function SettingsView() {
    const [activeSection, setActiveSection] = useState<SettingsSection>("link");

    return (
        <div className="h-full flex bg-base-100">
            {/* Settings Sidebar */}
            <div className="w-64 border-r border-base-200 p-4 shrink-0">
                <h2 className="text-lg font-semibold text-base-content mb-4 px-2">Settings</h2>
                <nav className="space-y-1">
                    {settingsSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`
                                    w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                                    ${isActive 
                                        ? "bg-primary/10 text-primary" 
                                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                                <div>
                                    <p className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                                        {section.label}
                                    </p>
                                    <p className="text-xs text-base-content/50 mt-0.5">
                                        {section.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-8">
                    {activeSection === "link" && <LinkSettingsSection />}
                    {activeSection === "notifications" && <ComingSoonSection title="Notifications" />}
                    {activeSection === "access" && <ComingSoonSection title="Access Control" />}
                    {activeSection === "advanced" && <ComingSoonSection title="Advanced Settings" />}
                </div>
            </div>
        </div>
    );
}

function LinkSettingsSection() {
    const { formId, shareUrl } = useFormBuilder();
    const toast = useToast();
    
    const [customUrl, setCustomUrl] = useState(shareUrl || "");
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [availability, setAvailability] = useState<"available" | "taken" | "invalid" | "current" | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize with current short code
    useEffect(() => {
        if (shareUrl) {
            setCustomUrl(shareUrl);
            setAvailability("current");
        }
    }, [shareUrl]);

    // Validate URL format
    const validateUrl = (url: string): { valid: boolean; error?: string } => {
        if (url.length < 4) {
            return { valid: false, error: "Must be at least 4 characters" };
        }
        if (url.length > 24) {
            return { valid: false, error: "Must be 24 characters or less" };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(url)) {
            return { valid: false, error: "Only letters, numbers, hyphens, and underscores allowed" };
        }
        return { valid: true };
    };

    // Debounced availability check
    const checkAvailability = useCallback(async (url: string) => {
        if (!formId || url === shareUrl) {
            setAvailability("current");
            setError(null);
            return;
        }

        const validation = validateUrl(url);
        if (!validation.valid) {
            setAvailability("invalid");
            setError(validation.error || "Invalid URL");
            return;
        }

        setIsChecking(true);
        setError(null);
        
        try {
            const result = await checkShortCodeAvailability(url, formId);
            if (result.available) {
                setAvailability("available");
            } else {
                setAvailability("taken");
                setError("This URL is already taken");
            }
        } catch (err) {
            setAvailability("invalid");
            setError("Failed to check availability");
        } finally {
            setIsChecking(false);
        }
    }, [formId, shareUrl]);

    // Check availability when URL changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (customUrl && customUrl !== shareUrl) {
                checkAvailability(customUrl);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [customUrl, checkAvailability, shareUrl]);

    const handleSave = async () => {
        if (!formId || availability !== "available") return;

        setIsSaving(true);
        try {
            await updateFormShortCode(formId, customUrl);
            setAvailability("current");
            toast.success("Custom URL saved successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save custom URL");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyUrl = () => {
        const fullUrl = `${window.location.origin}/submit/${shareUrl}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success("URL copied to clipboard!");
    };

    const getStatusIcon = () => {
        if (isChecking) return <LuLoader className="w-4 h-4 animate-spin text-base-content/50" />;
        if (availability === "available") return <LuCheck className="w-4 h-4 text-success" />;
        if (availability === "taken" || availability === "invalid") return <LuX className="w-4 h-4 text-error" />;
        if (availability === "current") return <LuCheck className="w-4 h-4 text-primary" />;
        return null;
    };

    const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/submit/` : "/submit/";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-base-content">Link Settings</h3>
                    <p className="text-sm text-base-content/60 mt-1">
                        Customize how your form URL appears when shared
                    </p>
                </div>
            </div>

            {/* Current URL Display */}
            <div className="bg-base-200/50 rounded-xl p-4 mb-6">
                <label className="text-sm font-medium text-base-content/70 mb-2 block">
                    Current Form URL
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-base-100 border border-base-300 rounded-lg px-3 py-2">
                        <span className="text-base-content/50 text-sm">{baseUrl}</span>
                        <span className="text-base-content font-medium text-sm">{shareUrl}</span>
                    </div>
                    <button
                        onClick={handleCopyUrl}
                        className="btn btn-ghost btn-sm gap-1.5"
                        title="Copy URL"
                    >
                        <LuCopy className="w-4 h-4" />
                    </button>
                    <a
                        href={`/submit/${shareUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm gap-1.5"
                        title="Open form"
                    >
                        <LuExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Custom URL Section */}
            <div className="border border-base-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <LuLink className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-medium text-base-content">Custom URL</h4>
                        <p className="text-sm text-base-content/60 mt-0.5">
                            Replace the auto-generated code with a custom URL (4-24 characters)
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-base-content/70 mb-1.5 block">
                            Custom URL Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-base-100 border border-base-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                <span className="text-base-content/40 text-sm pl-3 shrink-0">
                                    {baseUrl}
                                </span>
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => {
                                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                                        setCustomUrl(value);
                                        if (value === shareUrl) {
                                            setAvailability("current");
                                            setError(null);
                                        } else {
                                            setAvailability(null);
                                        }
                                    }}
                                    placeholder="my-awesome-form"
                                    className="flex-1 bg-transparent px-1 py-2.5 text-sm text-base-content focus:outline-none min-w-0"
                                    maxLength={24}
                                />
                                <div className="pr-3">
                                    {getStatusIcon()}
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={availability !== "available" || isSaving}
                                className="btn btn-primary btn-sm gap-1.5"
                            >
                                {isSaving ? (
                                    <>
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                        Saving
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </div>
                        
                        {/* Status Messages */}
                        <div className="mt-2 min-h-[20px]">
                            {error && (
                                <p className="text-xs text-error flex items-center gap-1">
                                    <LuX className="w-3 h-3" />
                                    {error}
                                </p>
                            )}
                            {availability === "available" && (
                                <p className="text-xs text-success flex items-center gap-1">
                                    <LuCheck className="w-3 h-3" />
                                    This URL is available!
                                </p>
                            )}
                            {availability === "current" && customUrl === shareUrl && (
                                <p className="text-xs text-primary flex items-center gap-1">
                                    <LuCheck className="w-3 h-3" />
                                    Current URL
                                </p>
                            )}
                        </div>
                    </div>

                    {/* URL Guidelines */}
                    <div className="flex items-start gap-2 p-3 bg-base-200/50 rounded-lg">
                        <LuInfo className="w-4 h-4 text-base-content/50 mt-0.5 shrink-0" />
                        <div className="text-xs text-base-content/60">
                            <p className="font-medium text-base-content/70 mb-1">URL Guidelines:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>4 to 24 characters long</li>
                                <li>Only letters, numbers, hyphens (-), and underscores (_)</li>
                                <li>Must be unique across all forms</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Preview Section - Coming Soon */}
            <div className="border border-base-200 rounded-xl p-6 mt-6 opacity-60">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-base-200 rounded-lg">
                        <LuPalette className="w-5 h-5 text-base-content/50" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-base-content">Social Preview</h4>
                            <span className="badge badge-sm badge-ghost">Coming Soon</span>
                        </div>
                        <p className="text-sm text-base-content/60 mt-0.5">
                            Customize how your form appears when shared on social media
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ComingSoonSection({ title }: { title: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-20"
        >
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <LuSettings className="w-8 h-8 text-base-content/30" />
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">{title}</h3>
            <p className="text-base-content/60 text-center max-w-sm">
                This feature is coming soon. Stay tuned for updates!
            </p>
        </motion.div>
    );
}
