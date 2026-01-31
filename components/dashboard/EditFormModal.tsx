"use client";

import { useState, useEffect } from "react";
import { updateFormMetadata } from "@/actions/form";
import { useToast } from "@/context/ToastContext";
import type { FormWithStats } from "@/types/form-builder";
import { LuX, LuLoader, LuPencil } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

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
                                <LuPencil className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-base-content">Edit Form</h2>
                                <p className="text-xs text-base-content/50">Update your form details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-base-content mb-1.5">
                                    Form Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter form name"
                                    className="w-full px-4 py-2.5 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-baseline justify-between mb-1.5">
                                    <label className="text-sm font-medium text-base-content">Description</label>
                                    <span className="text-xs text-base-content/40">Optional</span>
                                </div>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[100px]"
                                    placeholder="Add a brief description..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Footer */}
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
                                    isSubmitting || !name.trim()
                                        ? "bg-base-200 text-base-content/30 cursor-not-allowed"
                                        : "bg-primary text-primary-content hover:bg-primary/90 shadow-sm"
                                }`}
                                disabled={isSubmitting || !name.trim()}
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
