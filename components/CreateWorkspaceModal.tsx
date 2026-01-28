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
        <dialog id="create_workspace_modal" className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Create New Workspace</h3>
                <p className="py-4">Enter a name for your new workspace.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Workspace Name"
                        className="input input-bordered w-full mb-4"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                    />
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
                            {isSubmitting ? "Creating..." : "Create"}
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
