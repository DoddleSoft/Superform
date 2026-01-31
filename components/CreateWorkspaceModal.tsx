"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuX, LuLoader, LuFolder } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

export function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
    const { createWorkspace } = useWorkspace();
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createWorkspace(name);
            setName("");
            onClose();
        } catch (error) {
            console.error(error);
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
                    className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                                <LuFolder className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-base-content">Create Workspace</h2>
                                <p className="text-xs text-base-content/50">Organize your forms</p>
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Workspace"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
