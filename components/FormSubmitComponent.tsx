"use client";

import { FormElementInstance, FormSection, FormContent, FormStyle } from "@/types/form-builder";
import { FormElements } from "@/components/builder/FormElements";
import { useRef, useState, useTransition, useCallback, useEffect, useMemo } from "react";
import { submitForm, savePartialSubmission } from "@/actions/form";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuCheck } from "react-icons/lu";

// Generate a unique session ID for this form submission attempt
function generateSessionId(): string {
    return crypto.randomUUID();
}

interface FormSubmitComponentProps {
    formUrl: string;
    formId: string;
    content: FormContent; // Now expects Section[] format
    style?: FormStyle; // Form display style
}

export function FormSubmitComponent({
    formUrl,
    formId,
    content,
    style = 'classic', // Default to classic style
}: FormSubmitComponentProps) {
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

    // Normalize content: support both old flat format and new section format
    const sections: FormSection[] = Array.isArray(content) && content.length > 0
        ? (content[0] as any)?.elements !== undefined
            ? content as FormSection[] // New section format
            : [{ id: "default", title: "Form", elements: content as unknown as FormElementInstance[] }] // Old flat format
        : [];

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

        for (const field of currentSection.elements) {
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
            for (const field of section.elements) {
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
                await submitForm(formId, jsonContent, sessionId.current, totalSections);
                setSubmitted(true);
            } catch (error) {
                console.error(error);
                alert("Something went wrong");
            }
        });
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
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

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 text-center"
                >
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LuCheck className="w-8 h-8 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
                    <p className="text-base-content/60">
                        Your response has been submitted successfully. You can close this page now.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">This form is empty</h1>
                    <p className="text-base-content/60">No questions have been added yet.</p>
                </div>
            </div>
        );
    }

    // Classic style - One page with all sections visible
    if (style === 'classic') {
        return (
            <ClassicFormRenderer
                sections={sections}
                formValues={formValues}
                formErrors={formErrors}
                renderKey={renderKey}
                pending={pending}
                submitValue={submitValue}
                handleSubmit={handleSubmit}
                validateAllSections={validateAllSections}
                setRenderKey={setRenderKey}
            />
        );
    }

    // Typeform style - Step-by-step with slide animations (default/original behavior)
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-base-200 to-base-300">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <div className="h-1 bg-base-300">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Section Counter */}
            <div className="fixed top-4 right-4 z-50">
                <span className="text-sm text-base-content/50">
                    {currentSectionIndex + 1} / {totalSections}
                </span>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-4 pt-12">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentSection?.id || currentSectionIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="bg-base-100 rounded-2xl shadow-xl p-8 md:p-12"
                        >
                            {/* Section Header */}
                            {currentSection && (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                            {currentSection.title}
                                        </h2>
                                        {currentSection.description && (
                                            <p className="text-base-content/60">
                                                {currentSection.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Form Fields */}
                                    <div key={renderKey} className="space-y-6">
                                        {currentSection.elements.map((element) => {
                                            const FormElement = FormElements[element.type].formComponent;
                                            return (
                                                <FormElement
                                                    key={element.id}
                                                    element={element}
                                                    submitValue={submitValue}
                                                    isInvalid={formErrors.current[element.id]}
                                                    defaultValue={formValues.current[element.id]}
                                                />
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-sm border-t border-base-200">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        className={`btn btn-ghost gap-2 ${isFirstSection ? 'invisible' : ''}`}
                        onClick={handlePrevious}
                        disabled={isFirstSection}
                    >
                        <LuChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex gap-1">
                        {sections.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentSectionIndex
                                        ? 'bg-primary w-6'
                                        : index < currentSectionIndex
                                        ? 'bg-primary/50'
                                        : 'bg-base-300'
                                }`}
                            />
                        ))}
                    </div>

                    {isLastSection ? (
                        <button
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={pending}
                        >
                            {pending ? "Submitting..." : "Submit"}
                            <LuCheck className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary gap-2"
                            onClick={handleNext}
                        >
                            Next
                            <LuChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Classic Form Renderer - One page with all sections visible vertically
interface ClassicFormRendererProps {
    sections: FormSection[];
    formValues: React.MutableRefObject<{ [key: string]: string }>;
    formErrors: React.MutableRefObject<{ [key: string]: boolean }>;
    renderKey: number;
    pending: boolean;
    submitValue: (key: string, value: string) => void;
    handleSubmit: () => void;
    validateAllSections: () => boolean;
    setRenderKey: (key: number) => void;
}

function ClassicFormRenderer({
    sections,
    formValues,
    formErrors,
    renderKey,
    pending,
    submitValue,
    handleSubmit,
    validateAllSections,
    setRenderKey,
}: ClassicFormRendererProps) {
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAllSections()) {
            setRenderKey(new Date().getTime());
            return;
        }
        handleSubmit();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={onSubmit}>
                    <div className="space-y-8" key={renderKey}>
                        {sections.map((section, sectionIndex) => (
                            <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: sectionIndex * 0.1 }}
                                className="bg-base-100 rounded-2xl shadow-xl p-8 md:p-12"
                            >
                                {/* Section Header */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                                            Section {sectionIndex + 1}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                        {section.title}
                                    </h2>
                                    {section.description && (
                                        <p className="text-base-content/60">
                                            {section.description}
                                        </p>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {section.elements.map((element) => {
                                        const FormElement = FormElements[element.type].formComponent;
                                        return (
                                            <FormElement
                                                key={element.id}
                                                element={element}
                                                submitValue={submitValue}
                                                isInvalid={formErrors.current[element.id]}
                                                defaultValue={formValues.current[element.id]}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg gap-2 px-8"
                            disabled={pending}
                        >
                            {pending ? "Submitting..." : "Submit"}
                            <LuCheck className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
