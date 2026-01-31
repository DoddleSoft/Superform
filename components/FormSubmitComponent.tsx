"use client";

import { FormElementInstance, FormSection, FormContent, FormStyle, FormDesignSettings, DEFAULT_DESIGN_SETTINGS, getSectionElements, migrateToRowFormat, ThankYouPageSettings, DEFAULT_THANK_YOU_PAGE } from "@/types/form-builder";
import { FormElements } from "@/components/builder/FormElements";
import { useRef, useState, useTransition, useCallback, useEffect, useMemo } from "react";
import { submitForm, savePartialSubmission } from "@/actions/form";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuCheck, LuExternalLink } from "react-icons/lu";
import { ClassicRenderer } from "./renderers/ClassicRenderer";
import { TypeformRenderer } from "./renderers/TypeformRenderer";
import { getButtonStyle, FONT_FAMILY_MAP } from "@/lib/designUtils";
import { useToast } from "@/context/ToastContext";
import confetti from "canvas-confetti";

// Generate a unique session ID for this form submission attempt
function generateSessionId(): string {
    return crypto.randomUUID();
}

interface FormSubmitComponentProps {
    formUrl: string;
    formId: string;
    content: FormContent; // Now expects Section[] format
    style?: FormStyle; // Form display style
    designSettings?: Partial<FormDesignSettings>; // Design settings
    thankYouPage?: Partial<ThankYouPageSettings>; // Thank you page settings
    version?: number; // Form version for tracking
}

export function FormSubmitComponent({
    formUrl,
    formId,
    content,
    style = 'classic', // Default to classic style
    designSettings = {},
    thankYouPage = {},
    version = 1, // Default version
}: FormSubmitComponentProps) {
    const settings = { ...DEFAULT_DESIGN_SETTINGS, ...designSettings };
    const thankYouSettings = { ...DEFAULT_THANK_YOU_PAGE, ...thankYouPage };
    const toast = useToast();
    const formValues = useRef<{ [key: string]: string }>({});
    const formErrors = useRef<{ [key: string]: boolean }>({});
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [renderKey, setRenderKey] = useState(new Date().getTime());
    const [submitted, setSubmitted] = useState(false);
    const [pending, startTransition] = useTransition();
    const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

    // Session ID for tracking partial submissions
    const sessionId = useRef<string>(generateSessionId());
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Normalize content: support old flat format, old section format (elements), and new row format
    const sections: FormSection[] = useMemo(() => {
        if (!Array.isArray(content) || content.length === 0) {
            return [];
        }
        
        let rawSections: FormSection[];
        
        // Check if it's the new row format
        if ((content[0] as any)?.rows !== undefined) {
            rawSections = content as FormSection[];
        }
        // Check if it's the old section format with elements
        else if ((content[0] as any)?.elements !== undefined) {
            // Migrate each section to row format
            rawSections = content.map((s: any) => migrateToRowFormat(s));
        }
        // Old flat format - convert to section with rows
        else {
            const elements = content as unknown as FormElementInstance[];
            const section = migrateToRowFormat({
                id: "default",
                title: "Form",
                elements,
            });
            rawSections = [section];
        }
        
        // Filter out empty sections (sections with no elements)
        return rawSections.filter(section => getSectionElements(section).length > 0);
    }, [content]);

    const currentSection = sections[currentSectionIndex];
    const isFirstSection = currentSectionIndex === 0;
    const isLastSection = currentSectionIndex === sections.length - 1;
    const totalSections = sections.length;

    // Save partial submission after a delay (debounced)
    const savePartial = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Only save if there's some data
                if (Object.keys(formValues.current).length > 0) {
                    await savePartialSubmission(
                        formId,
                        sessionId.current,
                        formValues.current,
                        currentSectionIndex,
                        totalSections
                    );
                }
            } catch (error) {
                // Silently fail - we don't want to interrupt the user experience
                console.error("Failed to save partial submission:", error);
            }
        }, 2000); // Save after 2 seconds of inactivity
    }, [formId, currentSectionIndex, totalSections]);

    // Save partial when section changes or when user is about to leave
    useEffect(() => {
        // Save when navigating between sections
        if (Object.keys(formValues.current).length > 0) {
            savePartial();
        }
    }, [currentSectionIndex, savePartial]);

    // Save partial submission when user leaves the page
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable saving on page unload
            if (Object.keys(formValues.current).length > 0 && !submitted) {
                const payload = JSON.stringify({
                    formId,
                    sessionId: sessionId.current,
                    data: formValues.current,
                    currentSectionIndex,
                    totalSections,
                });
                // Note: In production, you'd want to set up an API endpoint for this
                // navigator.sendBeacon('/api/partial-submission', payload);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [formId, currentSectionIndex, totalSections, submitted]);

    // Validate current section
    const validateCurrentSection = useCallback(() => {
        if (!currentSection) return true;

        formErrors.current = {};
        let isValid = true;

        // Get all elements from the section's rows
        const elements = getSectionElements(currentSection);
        for (const field of elements) {
            const actualValue = formValues.current[field.id] || "";
            const valid = FormElements[field.type].validate(field, actualValue);

            if (!valid) {
                formErrors.current[field.id] = true;
                isValid = false;
            }
        }

        if (!isValid) {
            setRenderKey(new Date().getTime());
        }

        return isValid;
    }, [currentSection]);

    // Validate all sections for final submit
    const validateAllSections = useCallback(() => {
        formErrors.current = {};
        let isValid = true;

        for (const section of sections) {
            // Get all elements from the section's rows
            const elements = getSectionElements(section);
            for (const field of elements) {
                const actualValue = formValues.current[field.id] || "";
                const valid = FormElements[field.type].validate(field, actualValue);

                if (!valid) {
                    formErrors.current[field.id] = true;
                    isValid = false;
                }
            }
        }

        return isValid;
    }, [sections]);

    const submitValue = (key: string, value: string) => {
        formValues.current[key] = value;
        // Trigger partial save when values change
        savePartial();
    };

    const handleNext = () => {
        if (!validateCurrentSection()) {
            return;
        }

        if (!isLastSection) {
            setDirection(1);
            setCurrentSectionIndex((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstSection) {
            setDirection(-1);
            setCurrentSectionIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateAllSections()) {
            setRenderKey(new Date().getTime());
            return;
        }

        startTransition(async () => {
            try {
                const jsonContent = JSON.stringify(formValues.current);
                // Pass version and content snapshot for response integrity
                await submitForm(
                    formId,
                    jsonContent,
                    sessionId.current,
                    totalSections,
                    version,
                    content // Store the form content at time of submission
                );
                setSubmitted(true);
            } catch (error) {
                console.error(error);
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                // Check if current focused element is a textarea, if so allow enter for new line
                if (document.activeElement instanceof HTMLTextAreaElement) return;

                e.preventDefault();
                if (isLastSection) {
                    handleSubmit();
                } else {
                    handleNext();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLastSection, handleNext, handleSubmit]);

    // Trigger confetti on successful submission
    useEffect(() => {
        if (submitted && thankYouSettings.showConfetti) {
            // Fire confetti from both sides
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                colors: [settings.primaryColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            };

            function fire(particleRatio: number, opts: confetti.Options) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio),
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.7 } });
            fire(0.2, { spread: 60, origin: { x: 0.4, y: 0.7 } });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.6, y: 0.7 } });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.8, y: 0.7 } });
            fire(0.1, { spread: 120, startVelocity: 45, origin: { x: 0.5, y: 0.7 } });
        }
    }, [submitted, thankYouSettings.showConfetti, settings.primaryColor]);

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    // Handle button click on thank you page
    const handleThankYouButtonClick = () => {
        if (thankYouSettings.buttonUrl) {
            window.location.href = thankYouSettings.buttonUrl;
        } else {
            // Reload for another submission
            window.location.reload();
        }
    };

    if (submitted) {
        const buttonStyle = getButtonStyle(settings);
        
        return (
            <div 
                className="min-h-screen flex items-center justify-center p-4"
                style={{ 
                    backgroundColor: settings.backgroundColor,
                    fontFamily: FONT_FAMILY_MAP[settings.fontFamily],
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full rounded-2xl shadow-xl p-8 text-center"
                    style={{ backgroundColor: 'white' }}
                >
                    <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                        <LuCheck className="w-8 h-8" style={{ color: settings.primaryColor }} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: settings.textColor }}>
                        {thankYouSettings.title}
                    </h1>
                    <p style={{ color: settings.textColor, opacity: 0.6 }}>
                        {thankYouSettings.description}
                    </p>
                    {thankYouSettings.showButton && (
                        <button
                            onClick={handleThankYouButtonClick}
                            className="mt-6 px-6 py-2.5 font-medium rounded-lg transition-transform hover:scale-105 inline-flex items-center gap-2"
                            style={buttonStyle}
                        >
                            {thankYouSettings.buttonText}
                            {thankYouSettings.buttonUrl && <LuExternalLink className="w-4 h-4" />}
                        </button>
                    )}
                </motion.div>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div 
                className="min-h-screen flex items-center justify-center p-4"
                style={{ 
                    backgroundColor: settings.backgroundColor,
                    fontFamily: FONT_FAMILY_MAP[settings.fontFamily],
                }}
            >
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2" style={{ color: settings.textColor }}>This form is empty</h1>
                    <p style={{ color: settings.textColor, opacity: 0.6 }}>No questions have been added yet.</p>
                </div>
            </div>
        );
    }

    // Classic style - One page with all sections visible
    if (style === 'classic') {
        return (
            <ClassicRenderer
                sections={sections}
                formValues={formValues}
                formErrors={formErrors}
                renderKey={renderKey}
                pending={pending}
                submitValue={submitValue}
                handleSubmit={handleSubmit}
                validateAllSections={validateAllSections}
                setRenderKey={setRenderKey}
                designSettings={settings}
            />
        );
    }

    // Typeform style - Step-by-step
    return (
        <TypeformRenderer
            sections={sections}
            formValues={formValues}
            formErrors={formErrors}
            renderKey={renderKey}
            pending={pending}
            submitValue={submitValue}
            handleSubmit={handleSubmit}
            validateSection={validateCurrentSection}
            setRenderKey={setRenderKey}
            designSettings={settings}
        />
    );
}
