"use client";

import { motion } from "@/lib/animations";

export type DragIndicatorPosition = 'top' | 'bottom' | 'left' | 'right';

interface DragIndicatorProps {
    position: DragIndicatorPosition;
    isVisible: boolean;
    isRow?: boolean; // Whether this is a row-level indicator (full width)
}

export function DragIndicator({ position, isVisible, isRow = false }: DragIndicatorProps) {
    if (!isVisible) return null;

    const isHorizontal = position === 'top' || position === 'bottom';
    const baseClasses = "absolute z-30 pointer-events-none";
    
    const positionClasses: Record<DragIndicatorPosition, string> = {
        top: isRow 
            ? "-top-1 left-0 right-0 h-1" 
            : "-top-1 left-2 right-2 h-1",
        bottom: isRow 
            ? "-bottom-1 left-0 right-0 h-1" 
            : "-bottom-1 left-2 right-2 h-1",
        left: "-left-1.5 top-2 bottom-2 w-1",
        right: "-right-1.5 top-2 bottom-2 w-1",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: isHorizontal ? 0.95 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isHorizontal ? 0.95 : 0.95 }}
            className={`${baseClasses} ${positionClasses[position]}`}
        >
            <div className="w-full h-full relative">
                {/* Main indicator line */}
                <div className="absolute inset-0 bg-primary rounded-full shadow-sm" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/30 blur-sm rounded-full" />
                
                {/* Dot indicators at ends */}
                {isHorizontal ? (
                    <>
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-md" />
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-md" />
                    </>
                ) : (
                    <>
                        <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-md" />
                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-md" />
                    </>
                )}
            </div>
        </motion.div>
    );
}

// Drop zone overlay component for showing valid drop areas
interface DropZoneOverlayProps {
    isOver: boolean;
    canDrop?: boolean;
    label?: string;
    variant?: 'default' | 'side' | 'empty';
}

export function DropZoneOverlay({ isOver, canDrop = true, label, variant = 'default' }: DropZoneOverlayProps) {
    if (!isOver) return null;

    const variantStyles = {
        default: "border-primary bg-primary/5",
        side: "border-secondary bg-secondary/5 border-dashed",
        empty: "border-primary bg-primary/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 rounded-xl border-2 z-20 transition-colors ${
                canDrop ? variantStyles[variant] : "border-error/50 bg-error/5"
            }`}
        >
            {label && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        canDrop ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                    }`}>
                        {label}
                    </span>
                </div>
            )}
        </motion.div>
    );
}

// Side drop zone for adding element to the same row
interface SideDropZoneProps {
    position: 'left' | 'right';
    isOver: boolean;
    canDrop?: boolean;
}

export function SideDropZone({ position, isOver, canDrop = true }: SideDropZoneProps) {
    const positionClasses = position === 'left' 
        ? "left-0 top-0 bottom-0 w-1/3" 
        : "right-0 top-0 bottom-0 w-1/3";

    return (
        <div
            className={`absolute ${positionClasses} z-10 transition-all duration-200 ${
                isOver ? "opacity-100" : "opacity-0"
            }`}
        >
            {isOver && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute inset-1 rounded-lg border-2 border-dashed flex items-center justify-center ${
                        canDrop 
                            ? "border-secondary bg-secondary/10" 
                            : "border-error/50 bg-error/5"
                    }`}
                >
                    <span className={`text-xs font-medium ${
                        canDrop ? "text-secondary" : "text-error"
                    }`}>
                        {canDrop ? "Add side by side" : "Row full"}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
