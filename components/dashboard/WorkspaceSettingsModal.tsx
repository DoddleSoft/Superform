"use client";

import { useState, useEffect } from "react";
import { updateWorkspace, deleteWorkspace } from "@/actions/workspace";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { FiSettings, FiTrash2 } from "react-icons/fi";

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
        <dialog className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-base-200">
                        <FiSettings className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Workspace Settings</h3>
                </div>

                {!showDeleteConfirm ? (
                    <>
                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Workspace Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="My Workspace"
                                    className="input input-bordered w-full"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            {isDefault && (
                                <div className="alert alert-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span className="text-sm">This is your default workspace.</span>
                                </div>
                            )}

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting || !name.trim() || name === currentWorkspace.name}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
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
                            <div className="mt-6 pt-6 border-t border-base-200">
                                <h4 className="font-semibold text-error mb-2">Danger Zone</h4>
                                <p className="text-sm text-base-content/60 mb-4">
                                    Deleting a workspace will permanently remove all forms and submissions within it.
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-error btn-outline btn-sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    Delete Workspace
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="alert alert-error">
                            <FiTrash2 className="w-6 h-6" />
                            <div>
                                <h4 className="font-bold">Delete Workspace</h4>
                                <p className="text-sm">
                                    This action cannot be undone. All forms and submissions will be permanently deleted.
                                </p>
                            </div>
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">
                                    Type <strong>{currentWorkspace.name}</strong> to confirm
                                </span>
                            </label>
                            <input
                                type="text"
                                placeholder={currentWorkspace.name}
                                className="input input-bordered input-error w-full"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                disabled={isDeleting}
                            />
                        </div>

                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn"
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
                                className="btn btn-error"
                                onClick={handleDelete}
                                disabled={isDeleting || deleteConfirmText !== currentWorkspace.name}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Workspace"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
