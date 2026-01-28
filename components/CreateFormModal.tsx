"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSupabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { createForm } from "@/actions/form";
import { useRouter } from "next/navigation";

export function CreateFormModal({ onClose }: { onClose: () => void }) {
    const { currentWorkspace } = useWorkspace();
    const { user } = useUser();
    const supabase = useSupabase();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user || !currentWorkspace) return;

        setIsSubmitting(true);
        try {
            const newForm = await createForm(
                supabase,
                currentWorkspace.id,
                user.id,
                name,
                description
            );

            // Navigate to builder
            router.push(`/builder/${newForm.id}`);
            onClose();
        } catch (error: any) {
            console.error("Error creating form:", error);
            alert(`Failed to create form: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <dialog id="create_form_modal" className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Create New Form</h3>
                <p className="py-2 text-sm text-base-content/70">
                    In workspace: <span className="font-semibold">{currentWorkspace?.name}</span>
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Form Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Contact Form"
                            className="input input-bordered w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Description (Optional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder="Brief description of your form..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                        ></textarea>
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
                            {isSubmitting ? "Creating..." : "Create Form"}
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
