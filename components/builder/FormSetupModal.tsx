"use client";

import { useState } from "react";
import { updateFormMetadata } from "@/actions/form";
import { useToast } from "@/context/ToastContext";
import { LuX, LuLoader, LuSparkles } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface FormSetupModalProps {
    formId: string;
    defaultName: string;
    onClose: () => void;
    onUpdate: (name: string, description: string) => void;
}

export function FormSetupModal({ formId, defaultName, onClose, onUpdate }: FormSetupModalProps) {
    const { success, error } = useToast();
    const router = useRouter();
    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await updateFormMetadata(formId, {
                name: name.trim(),
                description: description.trim() || undefined,
            });

            success("Form ready!");
            onUpdate(name.trim(), description.trim());

            // Remove the ?new=true param from URL without refreshing
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            onClose();
        } catch (err: any) {
            console.error("Error updating form:", err);
            error(err.message || "Failed to setup form");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Remove the ?new=true param even if cancelling
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleClose}
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
                    <div className="bg-primary/5 px-6 py-6 border-b border-base-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <LuSparkles className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-base-content">Let's build your form</h2>
                        </div>
                        <p className="text-base-content/60 text-sm pl-[52px]">
                            Give your form a name to get started. You can always change this later.
                        </p>
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
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
                                    placeholder="e.g., Customer Feedback Survey"
                                    className="w-full px-4 py-3 bg-base-200/60 border-0 rounded-xl text-base placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
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
                                    className="w-full px-4 py-3 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[80px]"
                                    placeholder="What is this form about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 mt-8">
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl ${isSubmitting || !name.trim()
                                    ? "bg-base-200 text-base-content/30 cursor-not-allowed shadow-none"
                                    : "bg-primary text-primary-content hover:bg-primary/90 hover:-translate-y-0.5"
                                    }`}
                                disabled={isSubmitting || !name.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    "Start Building"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
