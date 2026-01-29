"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@clerk/nextjs";
import { createForm } from "@/actions/form";
import { useRouter } from "next/navigation";

export function CreateFormModal({ onClose }: { onClose: () => void }) {
    const { currentWorkspace } = useWorkspace();
    const { user } = useUser();
    const router = useRouter();
    const toast = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user || !currentWorkspace) return;

        setIsSubmitting(true);
        try {
            const newForm = await createForm(
                currentWorkspace.id,
                user.id,
                name,
                description
            );

            toast.success("Form created successfully!");
            // Navigate to builder
            router.push(`/builder/${newForm.id}`);
            onClose();
        } catch (error: any) {
            console.error("Error creating form:", error);
            toast.error(error.message || "Failed to create form");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-lg">
                <form method="dialog">
                    <button 
                        onClick={onClose} 
                        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </form>
                
                <h3 className="text-2xl font-bold mb-1">Create New Form</h3>
                <p className="text-sm text-base-content/60 mb-6">
                    In <span className="font-semibold">{currentWorkspace?.name}</span>
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="form-control w-full">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Form Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter form name"
                                className="input input-ghost w-full focus:bg-base-200"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-control w-full">
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="label-text font-medium">Description</span>
                                <span className="text-xs text-base-content/50">Optional</span>
                            </div>
                            <textarea
                                className="textarea textarea-ghost min-h-[100px] focus:bg-base-200 resize-none w-full"
                                placeholder="Add a brief description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
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
                                "Create Form"
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
