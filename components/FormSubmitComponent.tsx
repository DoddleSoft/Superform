"use client";

import { FormElementInstance, FormSection, FormContent } from "@/types/form-builder";
import { FormElements } from "@/components/builder/FormElements";
import { useRef, useState, useTransition, useCallback, useEffect } from "react";
import { submitForm } from "@/actions/form";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuCheck } from "react-icons/lu";

interface FormSubmitComponentProps {
    formUrl: string;
    formId: string;
    content: FormContent; // Now expects Section[] format
}

export function FormSubmitComponent({
    formUrl,
    formId,
    content,
}: FormSubmitComponentProps) {
    const formValues = useRef<{ [key: string]: string }>({});
    const formErrors = useRef<{ [key: string]: boolean }>({});
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [renderKey, setRenderKey] = useState(new Date().getTime());
    const [submitted, setSubmitted] = useState(false);
    const [pending, startTransition] = useTransition();
    const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

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
                await submitForm(formId, jsonContent);
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
