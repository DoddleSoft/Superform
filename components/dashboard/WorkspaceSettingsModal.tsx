"use client";

import { useState, useEffect } from "react";
import { updateWorkspace, deleteWorkspace } from "@/actions/workspace";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { LuSettings, LuTrash2, LuX, LuLoader, LuInfo, LuTriangleAlert } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

interface WorkspaceSettingsModalProps {
    onClose: () => void;
}

export function WorkspaceSettingsModal({ onClose }: WorkspaceSettingsModalProps) {
    const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
    const { success, error } = useToast();
    
    const [name, setName] = useState(currentWorkspace?.name || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Reset form when workspace changes
    useEffect(() => {
        setName(currentWorkspace?.name || "");
    }, [currentWorkspace]);

    if (!currentWorkspace) return null;

    const isDefault = currentWorkspace.is_default;
    const canDelete = !isDefault && workspaces.length > 1;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !currentWorkspace) return;

        setIsSubmitting(true);
        try {
            const updatedWorkspace = await updateWorkspace(currentWorkspace.id, {
                name: name.trim(),
            });
            
            // Update context
            setCurrentWorkspace(updatedWorkspace);
            success("Workspace updated successfully");
            onClose();
        } catch (err: any) {
            console.error("Error updating workspace:", err);
            error(err.message || "Failed to update workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentWorkspace || deleteConfirmText !== currentWorkspace.name) return;

        setIsDeleting(true);
        try {
            await deleteWorkspace(currentWorkspace.id);
            
            // Switch to another workspace
            const remaining = workspaces.filter(w => w.id !== currentWorkspace.id);
            if (remaining.length > 0) {
                setCurrentWorkspace(remaining[0]);
            }
            
            success("Workspace deleted successfully");
            onClose();
            // Force page reload to refresh data
            window.location.reload();
        } catch (err: any) {
            console.error("Error deleting workspace:", err);
            error(err.message || "Failed to delete workspace");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                                <LuSettings className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-base-content">Workspace Settings</h2>
                                <p className="text-xs text-base-content/50">Manage your workspace</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting || isDeleting}
                            className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                {!showDeleteConfirm ? (
                    <div className="p-6">
                        <form onSubmit={handleSave}>
                            <div>
                                <label className="block text-sm font-medium text-base-content mb-1.5">
                                    Workspace Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter workspace name"
                                    className="w-full px-4 py-2.5 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            {isDefault && (
                                <div className="flex items-center gap-3 mt-4 p-3 bg-info/10 rounded-xl">
                                    <LuInfo className="w-5 h-5 text-info flex-shrink-0" />
                                    <span className="text-sm text-info">This is your default workspace</span>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-base-200">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        isSubmitting || !name.trim() || name === currentWorkspace.name
                                            ? "bg-base-200 text-base-content/30 cursor-not-allowed"
                                            : "bg-primary text-primary-content hover:bg-primary/90 shadow-sm"
                                    }`}
                                    disabled={isSubmitting || !name.trim() || name === currentWorkspace.name}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LuLoader className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Danger Zone */}
                        {canDelete && (
                            <div className="mt-6 pt-6 border-t border-error/20 rounded-xl bg-error/5 -mx-6 -mb-6 px-6 pb-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <LuTrash2 className="w-5 h-5 text-error" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-error mb-1">Danger Zone</h4>
                                        <p className="text-sm text-base-content/60">
                                            Permanently delete this workspace and all its forms
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl text-sm font-medium hover:bg-error/20 transition-colors"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <LuTrash2 className="w-4 h-4" />
                                    Delete Workspace
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex items-start gap-4 p-4 bg-error/10 rounded-xl mb-4">
                            <LuTriangleAlert className="w-6 h-6 text-error flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-error">Delete Workspace?</h4>
                                <p className="text-sm text-base-content/70 mt-1">
                                    This action cannot be undone. All forms and submissions will be permanently deleted.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1.5">
                                Type <span className="text-error font-semibold">{currentWorkspace.name}</span> to confirm
                            </label>
                            <input
                                type="text"
                                placeholder={currentWorkspace.name}
                                className="w-full px-4 py-2.5 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-error/20"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                disabled={isDeleting}
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-base-200">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText("");
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    isDeleting || deleteConfirmText !== currentWorkspace.name
                                        ? "bg-base-200 text-base-content/30 cursor-not-allowed"
                                        : "bg-error text-error-content hover:bg-error/90 shadow-sm"
                                }`}
                                onClick={handleDelete}
                                disabled={isDeleting || deleteConfirmText !== currentWorkspace.name}
                            >
                                {isDeleting ? (
                                    <>
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <LuTrash2 className="w-4 h-4" />
                                        Delete Workspace
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
