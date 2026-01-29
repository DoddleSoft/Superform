"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveFormContent } from "@/actions/form";
import { FormElementInstance } from "@/types/form-builder";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
    formId: string | null;
    elements: FormElementInstance[];
    debounceMs?: number;
}

interface UseAutoSaveReturn {
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
    saveNow: () => Promise<void>;
    error: Error | null;
}

export function useAutoSave({
    formId,
    elements,
    debounceMs = 1500,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Track if initial load is complete to avoid saving on mount
    const isInitialMount = useRef(true);
    const previousElementsRef = useRef<string>("");
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    const performSave = useCallback(async () => {
        if (!formId || isSavingRef.current) return;

        const currentContent = JSON.stringify(elements);
        
        // Skip if content hasn't changed
        if (currentContent === previousElementsRef.current) {
            return;
        }

        isSavingRef.current = true;
        setSaveStatus("saving");
        setError(null);

        try {
            await saveFormContent(formId, currentContent);
            previousElementsRef.current = currentContent;
            setLastSavedAt(new Date());
            setSaveStatus("saved");

            // Reset to idle after a short delay
            setTimeout(() => {
                setSaveStatus((current) => (current === "saved" ? "idle" : current));
            }, 2000);
        } catch (err) {
            console.error("Auto-save failed:", err);
            setError(err instanceof Error ? err : new Error("Failed to save"));
            setSaveStatus("error");
        } finally {
            isSavingRef.current = false;
        }
    }, [formId, elements]);

    // Manual save function
    const saveNow = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        await performSave();
    }, [performSave]);

    // Auto-save effect with debouncing
    useEffect(() => {
        // Skip initial mount to avoid saving the initially loaded content
        if (isInitialMount.current) {
            isInitialMount.current = false;
            previousElementsRef.current = JSON.stringify(elements);
            return;
        }

        // Don't save if no formId
        if (!formId) return;

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced save
        debounceTimerRef.current = setTimeout(() => {
            performSave();
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [elements, formId, debounceMs, performSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        saveStatus,
        lastSavedAt,
        saveNow,
        error,
    };
}
