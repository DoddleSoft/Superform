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
    LuMail,
    LuWebhook,
    LuLock,
    LuGlobe,
    LuCalendar,
    LuMessageSquare,
    LuPlus,
    LuEye,
    LuEyeOff,
} from "react-icons/lu";
import { checkShortCodeAvailability, updateFormShortCode, saveFormSettings } from "@/actions/form";
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

// ============== Default Settings Values ==============
const DEFAULT_FORM_SETTINGS = {
    notifications: {
        emailNotificationsEnabled: false,
        notificationEmails: [] as string[],
        notifyOnSubmission: true,
        notifyOnPartialSubmission: false,
        webhookEnabled: false,
        webhookUrl: "",
        webhookSecret: "",
    },
    access: {
        accessType: "public" as "public" | "password" | "closed",
        password: "",
        closedMessage: "This form is currently not accepting responses.",
        scheduleEnabled: false,
        scheduleStart: "",
        scheduleEnd: "",
        limitResponses: false,
        maxResponses: 100,
    },
    advanced: {
        allowMultipleSubmissions: true,
        showProgressBar: true,
        showQuestionNumbers: true,
        autosaveEnabled: true,
        confirmBeforeSubmit: false,
        collectDeviceInfo: false,
    },
};

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
                    {activeSection === "notifications" && <NotificationsSettingsSection />}
                    {activeSection === "access" && <AccessSettingsSection />}
                    {activeSection === "advanced" && <AdvancedSettingsSection />}
                </div>
            </div>
        </div>
    );
}

// ============== Shared Toggle Component ==============
function Toggle({
    enabled,
    onChange,
    label,
    description,
}: {
    enabled: boolean;
    onChange: (val: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium text-base-content">{label}</p>
                {description && <p className="text-xs text-base-content/60 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-base-300"
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );
}

// ============== Section Header ==============
function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-base-content">{title}</h3>
            <p className="text-sm text-base-content/60 mt-1">{description}</p>
        </div>
    );
}

// ============== Settings Card ==============
function SettingsCard({
    icon: Icon,
    title,
    description,
    children,
    comingSoon,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    children?: React.ReactNode;
    comingSoon?: boolean;
}) {
    return (
        <div className={`border border-base-200 rounded-xl p-6 ${comingSoon ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${comingSoon ? "bg-base-200" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${comingSoon ? "text-base-content/50" : "text-primary"}`} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-base-content">{title}</h4>
                        {comingSoon && <span className="badge badge-sm badge-ghost">Coming Soon</span>}
                    </div>
                    <p className="text-sm text-base-content/60 mt-0.5">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

// ============== Link Settings ==============
function LinkSettingsSection() {
    const { formId, shareUrl } = useFormBuilder();
    const toast = useToast();

    const [customUrl, setCustomUrl] = useState(shareUrl || "");
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [availability, setAvailability] = useState<"available" | "taken" | "invalid" | "current" | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (shareUrl) {
            setCustomUrl(shareUrl);
            setAvailability("current");
        }
    }, [shareUrl]);

    const validateUrl = (url: string): { valid: boolean; error?: string } => {
        if (url.length < 4) return { valid: false, error: "Must be at least 4 characters" };
        if (url.length > 24) return { valid: false, error: "Must be 24 characters or less" };
        if (!/^[a-zA-Z0-9_-]+$/.test(url)) return { valid: false, error: "Only letters, numbers, hyphens, and underscores allowed" };
        return { valid: true };
    };

    const checkAvailability = useCallback(
        async (url: string) => {
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
                setAvailability(result.available ? "available" : "taken");
                if (!result.available) setError("This URL is already taken");
            } catch {
                setAvailability("invalid");
                setError("Failed to check availability");
            } finally {
                setIsChecking(false);
            }
        },
        [formId, shareUrl]
    );

    useEffect(() => {
        const tid = setTimeout(() => {
            if (customUrl && customUrl !== shareUrl) checkAvailability(customUrl);
        }, 500);
        return () => clearTimeout(tid);
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
        navigator.clipboard.writeText(`${window.location.origin}/submit/${shareUrl}`);
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <SectionHeader title="Link Settings" description="Customize how your form URL appears when shared" />

            {/* Current URL */}
            <div className="bg-base-200/50 rounded-xl p-4 mb-6">
                <label className="text-sm font-medium text-base-content/70 mb-2 block">Current Form URL</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-base-100 border border-base-300 rounded-lg px-3 py-2">
                        <span className="text-base-content/50 text-sm">{baseUrl}</span>
                        <span className="text-base-content font-medium text-sm">{shareUrl}</span>
                    </div>
                    <button onClick={handleCopyUrl} className="btn btn-ghost btn-sm" title="Copy URL">
                        <LuCopy className="w-4 h-4" />
                    </button>
                    <a href={`/submit/${shareUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Open form">
                        <LuExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Custom URL */}
            <SettingsCard icon={LuLink} title="Custom URL" description="Replace the auto-generated code with a custom URL (4-24 characters)">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Custom URL Slug</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-base-100 border border-base-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                <span className="text-base-content/40 text-sm pl-3 shrink-0">{baseUrl}</span>
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
                                <div className="pr-3">{getStatusIcon()}</div>
                            </div>
                            <button onClick={handleSave} disabled={availability !== "available" || isSaving} className="btn btn-primary btn-sm gap-1.5">
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
            </SettingsCard>

            {/* Social Preview - Coming Soon */}
            <div className="mt-6">
                <SettingsCard icon={LuPalette} title="Social Preview" description="Customize how your form appears when shared on social media" comingSoon />
            </div>
        </motion.div>
    );
}

// ============== Notifications Settings ==============
function NotificationsSettingsSection() {
    const { formId, formSettings, setFormSettings } = useFormBuilder();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const notifications = { ...DEFAULT_FORM_SETTINGS.notifications, ...formSettings?.notifications };

    const [emailEnabled, setEmailEnabled] = useState(notifications.emailNotificationsEnabled);
    const [emails, setEmails] = useState<string[]>(notifications.notificationEmails || []);
    const [newEmail, setNewEmail] = useState("");
    const [notifyOnSubmit, setNotifyOnSubmit] = useState(notifications.notifyOnSubmission);
    const [notifyOnPartial, setNotifyOnPartial] = useState(notifications.notifyOnPartialSubmission);
    const [webhookEnabled, setWebhookEnabled] = useState(notifications.webhookEnabled);
    const [webhookUrl, setWebhookUrl] = useState(notifications.webhookUrl || "");
    const [webhookSecret, setWebhookSecret] = useState(notifications.webhookSecret || "");
    const [showSecret, setShowSecret] = useState(false);

    const hasChanges = useCallback(() => {
        const current = {
            emailNotificationsEnabled: emailEnabled,
            notificationEmails: emails,
            notifyOnSubmission: notifyOnSubmit,
            notifyOnPartialSubmission: notifyOnPartial,
            webhookEnabled,
            webhookUrl,
            webhookSecret,
        };
        return JSON.stringify(current) !== JSON.stringify(notifications);
    }, [emailEnabled, emails, notifyOnSubmit, notifyOnPartial, webhookEnabled, webhookUrl, webhookSecret, notifications]);

    const handleAddEmail = () => {
        const trimmed = newEmail.trim().toLowerCase();
        if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
            setEmails([...emails, trimmed]);
            setNewEmail("");
        }
    };

    const handleRemoveEmail = (email: string) => setEmails(emails.filter((e) => e !== email));

    const handleSave = async () => {
        if (!formId) return;
        setIsSaving(true);
        try {
            const updatedNotifications = {
                emailNotificationsEnabled: emailEnabled,
                notificationEmails: emails,
                notifyOnSubmission: notifyOnSubmit,
                notifyOnPartialSubmission: notifyOnPartial,
                webhookEnabled,
                webhookUrl,
                webhookSecret,
            };
            const newSettings = { ...formSettings, notifications: updatedNotifications };
            await saveFormSettings(formId, newSettings);
            setFormSettings(newSettings);
            toast.success("Notification settings saved!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <SectionHeader title="Notifications" description="Configure how you get notified about form submissions" />

            {/* Email Notifications */}
            <SettingsCard icon={LuMail} title="Email Notifications" description="Receive emails when someone submits your form">
                <div className="space-y-4">
                    <Toggle enabled={emailEnabled} onChange={setEmailEnabled} label="Enable email notifications" />

                    {emailEnabled && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Notification Recipients</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                                        placeholder="email@example.com"
                                        className="input input-bordered input-sm flex-1"
                                    />
                                    <button onClick={handleAddEmail} className="btn btn-sm btn-ghost">
                                        <LuPlus className="w-4 h-4" />
                                    </button>
                                </div>
                                {emails.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {emails.map((email) => (
                                            <span key={email} className="badge badge-lg gap-1">
                                                {email}
                                                <button onClick={() => handleRemoveEmail(email)} className="hover:text-error">
                                                    <LuX className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-2 border-t border-base-200">
                                <Toggle enabled={notifyOnSubmit} onChange={setNotifyOnSubmit} label="Notify on complete submissions" description="Get notified when someone fully submits the form" />
                                <Toggle enabled={notifyOnPartial} onChange={setNotifyOnPartial} label="Notify on partial submissions" description="Get notified when someone starts but doesn't complete the form" />
                            </div>
                        </>
                    )}
                </div>
            </SettingsCard>

            {/* Webhook */}
            <div className="mt-6">
                <SettingsCard icon={LuWebhook} title="Webhook" description="Send form submissions to an external URL in real-time">
                    <div className="space-y-4">
                        <Toggle enabled={webhookEnabled} onChange={setWebhookEnabled} label="Enable webhook" />

                        {webhookEnabled && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        placeholder="https://your-server.com/webhook"
                                        className="input input-bordered input-sm w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Webhook Secret (optional)</label>
                                    <div className="relative">
                                        <input
                                            type={showSecret ? "text" : "password"}
                                            value={webhookSecret}
                                            onChange={(e) => setWebhookSecret(e.target.value)}
                                            placeholder="your-secret-key"
                                            className="input input-bordered input-sm w-full pr-10"
                                        />
                                        <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content">
                                            {showSecret ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-base-content/50 mt-1">Used to verify webhook payloads</p>
                                </div>
                            </>
                        )}
                    </div>
                </SettingsCard>
            </div>

            {/* Save */}
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={isSaving || !hasChanges()} className="btn btn-primary gap-2">
                    {isSaving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuCheck className="w-4 h-4" />}
                    Save Notification Settings
                </button>
            </div>
        </motion.div>
    );
}

// ============== Access Control Settings ==============
function AccessSettingsSection() {
    const { formId, formSettings, setFormSettings } = useFormBuilder();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const access = { ...DEFAULT_FORM_SETTINGS.access, ...formSettings?.access };

    const [accessType, setAccessType] = useState<"public" | "password" | "closed">(access.accessType);
    const [password, setPassword] = useState(access.password || "");
    const [closedMessage, setClosedMessage] = useState(access.closedMessage || "");
    const [scheduleEnabled, setScheduleEnabled] = useState(access.scheduleEnabled);
    const [scheduleStart, setScheduleStart] = useState(access.scheduleStart || "");
    const [scheduleEnd, setScheduleEnd] = useState(access.scheduleEnd || "");
    const [limitResponses, setLimitResponses] = useState(access.limitResponses);
    const [maxResponses, setMaxResponses] = useState(access.maxResponses || 100);
    const [showPassword, setShowPassword] = useState(false);

    const hasChanges = useCallback(() => {
        const current = { accessType, password, closedMessage, scheduleEnabled, scheduleStart, scheduleEnd, limitResponses, maxResponses };
        return JSON.stringify(current) !== JSON.stringify(access);
    }, [accessType, password, closedMessage, scheduleEnabled, scheduleStart, scheduleEnd, limitResponses, maxResponses, access]);

    const handleSave = async () => {
        if (!formId) return;
        setIsSaving(true);
        try {
            const updatedAccess = { accessType, password, closedMessage, scheduleEnabled, scheduleStart, scheduleEnd, limitResponses, maxResponses };
            const newSettings = { ...formSettings, access: updatedAccess };
            await saveFormSettings(formId, newSettings);
            setFormSettings(newSettings);
            toast.success("Access settings saved!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <SectionHeader title="Access Control" description="Control who can view and submit your form" />

            {/* Access Type */}
            <SettingsCard icon={LuGlobe} title="Form Access" description="Choose who can access your form">
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-base-200 cursor-pointer hover:bg-base-100 transition-colors">
                        <input type="radio" name="access" className="radio radio-primary radio-sm" checked={accessType === "public"} onChange={() => setAccessType("public")} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-base-content">Public</p>
                            <p className="text-xs text-base-content/60">Anyone with the link can view and submit</p>
                        </div>
                        <LuGlobe className="w-5 h-5 text-base-content/40" />
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-base-200 cursor-pointer hover:bg-base-100 transition-colors">
                        <input type="radio" name="access" className="radio radio-primary radio-sm" checked={accessType === "password"} onChange={() => setAccessType("password")} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-base-content">Password Protected</p>
                            <p className="text-xs text-base-content/60">Requires a password to view</p>
                        </div>
                        <LuLock className="w-5 h-5 text-base-content/40" />
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-base-200 cursor-pointer hover:bg-base-100 transition-colors">
                        <input type="radio" name="access" className="radio radio-primary radio-sm" checked={accessType === "closed"} onChange={() => setAccessType("closed")} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-base-content">Closed</p>
                            <p className="text-xs text-base-content/60">Form is not accepting responses</p>
                        </div>
                        <LuX className="w-5 h-5 text-base-content/40" />
                    </label>

                    {accessType === "password" && (
                        <div className="pt-3 border-t border-base-200">
                            <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Form Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="input input-bordered input-sm w-full pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content">
                                    {showPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {accessType === "closed" && (
                        <div className="pt-3 border-t border-base-200">
                            <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Closed Message</label>
                            <textarea value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} placeholder="This form is currently not accepting responses." className="textarea textarea-bordered textarea-sm w-full" rows={2} />
                        </div>
                    )}
                </div>
            </SettingsCard>

            {/* Schedule */}
            <div className="mt-6">
                <SettingsCard icon={LuCalendar} title="Availability Schedule" description="Set a time window for when your form accepts responses">
                    <div className="space-y-4">
                        <Toggle enabled={scheduleEnabled} onChange={setScheduleEnabled} label="Enable scheduling" />
                        {scheduleEnabled && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Start Date & Time</label>
                                    <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="input input-bordered input-sm w-full" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-base-content/70 mb-1.5 block">End Date & Time</label>
                                    <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="input input-bordered input-sm w-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </SettingsCard>
            </div>

            {/* Response Limit */}
            <div className="mt-6">
                <SettingsCard icon={LuMessageSquare} title="Response Limit" description="Limit the number of submissions your form can receive">
                    <div className="space-y-4">
                        <Toggle enabled={limitResponses} onChange={setLimitResponses} label="Limit responses" />
                        {limitResponses && (
                            <div>
                                <label className="text-sm font-medium text-base-content/70 mb-1.5 block">Maximum Responses</label>
                                <input type="number" value={maxResponses} onChange={(e) => setMaxResponses(Number(e.target.value))} min={1} className="input input-bordered input-sm w-32" />
                            </div>
                        )}
                    </div>
                </SettingsCard>
            </div>

            {/* Save */}
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={isSaving || !hasChanges()} className="btn btn-primary gap-2">
                    {isSaving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuCheck className="w-4 h-4" />}
                    Save Access Settings
                </button>
            </div>
        </motion.div>
    );
}

// ============== Advanced Settings ==============
function AdvancedSettingsSection() {
    const { formId, formSettings, setFormSettings } = useFormBuilder();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const advanced = { ...DEFAULT_FORM_SETTINGS.advanced, ...formSettings?.advanced };

    const [allowMultiple, setAllowMultiple] = useState(advanced.allowMultipleSubmissions);
    const [showProgress, setShowProgress] = useState(advanced.showProgressBar);
    const [showNumbers, setShowNumbers] = useState(advanced.showQuestionNumbers);
    const [autosave, setAutosave] = useState(advanced.autosaveEnabled);
    const [confirmSubmit, setConfirmSubmit] = useState(advanced.confirmBeforeSubmit);
    const [collectDevice, setCollectDevice] = useState(advanced.collectDeviceInfo);

    const hasChanges = useCallback(() => {
        const current = {
            allowMultipleSubmissions: allowMultiple,
            showProgressBar: showProgress,
            showQuestionNumbers: showNumbers,
            autosaveEnabled: autosave,
            confirmBeforeSubmit: confirmSubmit,
            collectDeviceInfo: collectDevice,
        };
        return JSON.stringify(current) !== JSON.stringify(advanced);
    }, [allowMultiple, showProgress, showNumbers, autosave, confirmSubmit, collectDevice, advanced]);

    const handleSave = async () => {
        if (!formId) return;
        setIsSaving(true);
        try {
            const updatedAdvanced = {
                allowMultipleSubmissions: allowMultiple,
                showProgressBar: showProgress,
                showQuestionNumbers: showNumbers,
                autosaveEnabled: autosave,
                confirmBeforeSubmit: confirmSubmit,
                collectDeviceInfo: collectDevice,
            };
            const newSettings = { ...formSettings, advanced: updatedAdvanced };
            await saveFormSettings(formId, newSettings);
            setFormSettings(newSettings);
            toast.success("Advanced settings saved!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <SectionHeader title="Advanced Settings" description="Additional options to customize form behavior" />

            {/* Submission Behavior */}
            <SettingsCard icon={LuMessageSquare} title="Submission Behavior" description="Control how submissions work">
                <div className="space-y-4">
                    <Toggle enabled={allowMultiple} onChange={setAllowMultiple} label="Allow multiple submissions" description="Let users submit the form more than once" />
                    <Toggle enabled={confirmSubmit} onChange={setConfirmSubmit} label="Confirm before submit" description="Show a confirmation dialog before final submission" />
                    <Toggle enabled={autosave} onChange={setAutosave} label="Autosave progress" description="Automatically save user's progress as they fill out the form" />
                </div>
            </SettingsCard>

            {/* Display Options */}
            <div className="mt-6">
                <SettingsCard icon={LuEye} title="Display Options" description="Customize what users see">
                    <div className="space-y-4">
                        <Toggle enabled={showProgress} onChange={setShowProgress} label="Show progress bar" description="Display a progress indicator for multi-section forms" />
                        <Toggle enabled={showNumbers} onChange={setShowNumbers} label="Show question numbers" description="Number each question in the form" />
                    </div>
                </SettingsCard>
            </div>

            {/* Data Collection */}
            <div className="mt-6">
                <SettingsCard icon={LuInfo} title="Data Collection" description="Additional data to collect with submissions">
                    <div className="space-y-4">
                        <Toggle enabled={collectDevice} onChange={setCollectDevice} label="Collect device information" description="Store browser, device type, and OS with each submission" />
                    </div>
                </SettingsCard>
            </div>

            {/* Save */}
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={isSaving || !hasChanges()} className="btn btn-primary gap-2">
                    {isSaving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuCheck className="w-4 h-4" />}
                    Save Advanced Settings
                </button>
            </div>
        </motion.div>
    );
}
