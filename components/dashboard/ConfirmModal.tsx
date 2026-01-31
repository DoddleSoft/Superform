"use client";

import { useState } from "react";
import { LuTriangleAlert, LuInfo, LuLoader, LuX } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Confirm action failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonStyles = () => {
        switch (variant) {
            case "danger":
                return "bg-error text-error-content hover:bg-error/90";
            case "warning":
                return "bg-warning text-warning-content hover:bg-warning/90";
            case "info":
            default:
                return "bg-info text-info-content hover:bg-info/90";
        }
    };

    const getIconContainerStyles = () => {
        switch (variant) {
            case "danger":
                return "bg-error/10";
            case "warning":
                return "bg-warning/10";
            case "info":
            default:
                return "bg-info/10";
        }
    };

    const getIconColor = () => {
        switch (variant) {
            case "danger":
                return "text-error";
            case "warning":
                return "text-warning";
            case "info":
            default:
                return "text-info";
        }
    };

    const IconComponent = variant === "info" ? LuInfo : LuTriangleAlert;

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
                    <div className="flex items-start justify-between px-6 pt-6 pb-4">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 ${getIconContainerStyles()} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <IconComponent className={`w-6 h-6 ${getIconColor()}`} />
                            </div>
                            <div className="pt-1">
                                <h2 className="text-lg font-semibold text-base-content">{title}</h2>
                                <p className="text-sm text-base-content/60 mt-1">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors -mt-2 -mr-2"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-base-200">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${getButtonStyles()}`}
                            onClick={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmLabel
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
