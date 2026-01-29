"use client";

import { useState, useEffect } from "react";
import { updateFormMetadata } from "@/actions/form";
import { useToast } from "@/context/ToastContext";
import type { FormWithStats } from "@/types/form-builder";

interface EditFormModalProps {
    form: FormWithStats;
    onClose: () => void;
    onSuccess: (updatedForm: FormWithStats) => void;
}

export function EditFormModal({ form, onClose, onSuccess }: EditFormModalProps) {
    const { success, error } = useToast();
    const [name, setName] = useState(form.name);
    const [description, setDescription] = useState(form.description || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when form prop changes
    useEffect(() => {
        setName(form.name);
        setDescription(form.description || "");
    }, [form]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const updatedForm = await updateFormMetadata(form.id, {
                name: name.trim(),
                description: description.trim() || undefined,
            });
            
            success("Form updated successfully");
            onSuccess({ ...form, ...updatedForm });
            onClose();
        } catch (err: any) {
            console.error("Error updating form:", err);
            error(err.message || "Failed to update form");
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
                
                <h3 className="text-2xl font-bold mb-1">Edit Form</h3>
                <p className="text-sm text-base-content/60 mb-6">Update your form details</p>

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
                                    Saving
                                </>
                            ) : (
                                "Save Changes"
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
