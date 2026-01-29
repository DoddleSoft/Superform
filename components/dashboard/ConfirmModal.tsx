"use client";

import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

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

    const getButtonClass = () => {
        switch (variant) {
            case "danger":
                return "btn-error";
            case "warning":
                return "btn-warning";
            case "info":
            default:
                return "btn-info";
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

    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-base-200 ${getIconColor()}`}>
                        <FiAlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="py-2 text-base-content/70">{message}</p>
                    </div>
                </div>

                <div className="modal-action">
                    <button
                        type="button"
                        className="btn"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn ${getButtonClass()}`}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
