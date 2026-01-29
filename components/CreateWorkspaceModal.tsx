"use client";

import { useState, useRef } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

export function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
    const { createWorkspace } = useWorkspace();
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDialogElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createWorkspace(name);
            setName("");
            onClose(); // Close the modal via parent handler
            // Or if using DaisyUI native modal method:
            // if (modalRef.current) modalRef.current.close();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-md">
                <form method="dialog">
                    <button 
                        onClick={onClose} 
                        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </form>
                
                <h3 className="text-2xl font-bold mb-1">Create Workspace</h3>
                <p className="text-sm text-base-content/60 mb-6">Organize your forms in a new workspace</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Workspace Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter workspace name"
                            className="input input-ghost w-full focus:bg-base-200"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                            required
                        />
                    </div>

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
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating
                                </>
                            ) : (
                                "Create Workspace"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
