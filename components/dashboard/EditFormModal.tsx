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
            <div className="modal-box">
                <h3 className="font-bold text-lg">Edit Form Details</h3>
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
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
