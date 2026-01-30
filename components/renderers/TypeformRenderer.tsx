"use client";

import { FormElements } from "@/components/builder/FormElements";
import { FormElementInstance, FormSection } from "@/types/form-builder";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuCheck, LuArrowDown } from "react-icons/lu";
import { useState, useRef, useEffect } from "react";

interface TypeformRendererProps {
    sections: FormSection[];
    formValues: React.MutableRefObject<{ [key: string]: string }>;
    formErrors: React.MutableRefObject<{ [key: string]: boolean }>;
    renderKey: number;
    pending: boolean;
    submitValue: (key: string, value: string) => void;
    handleSubmit: () => void;
    validateSection: (sectionIndex: number) => boolean;
    setRenderKey: (key: number) => void;
    // Optional props for controlled mode (preview)
    currentSectionIndex?: number;
    onSectionChange?: (index: number) => void;
}

export function TypeformRenderer({
    sections,
    formValues,
    formErrors,
    renderKey,
    pending,
    submitValue,
    handleSubmit,
    validateSection,
    setRenderKey,
    currentSectionIndex: controlledIndex,
    onSectionChange,
}: TypeformRendererProps) {
    const [internalIndex, setInternalIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Use controlled index if provided, otherwise internal state
    const currentSectionIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

    const currentSection = sections[currentSectionIndex];
    const totalSections = sections.length;
    const isFirstSection = currentSectionIndex === 0;
    const isLastSection = currentSectionIndex === totalSections - 1;

    // Handle navigation
    const handleNext = () => {
        if (!validateSection(currentSectionIndex)) {
            setRenderKey(new Date().getTime());
            return;
        }

        if (!isLastSection) {
            setDirection(1);
            if (onSectionChange) {
                onSectionChange(currentSectionIndex + 1);
            } else {
                setInternalIndex(prev => prev + 1);
            }
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (!isFirstSection) {
            setDirection(-1);
            if (onSectionChange) {
                onSectionChange(currentSectionIndex - 1);
            } else {
                setInternalIndex(prev => prev - 1);
            }
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                // Check if current focused element is a textarea, if so allow enter for new line
                if (document.activeElement instanceof HTMLTextAreaElement) return;

                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSectionIndex]); // Re-bind when section changes

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            y: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            y: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            y: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    if (!currentSection) return null;

    return (
        <div className="absolute inset-0 bg-[#fafafa] text-[#262627] flex flex-col font-sans overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-50">
                <div className="h-1 bg-gray-200">
                    <motion.div
                        className="h-full bg-[#0445AF]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-8 md:px-12 relative z-10">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSection.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="w-full flex flex-col gap-8"
                    >
                        {/* Section Question / Header */}
                        <div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-[#0445AF] font-medium text-lg">
                                    {currentSectionIndex + 1}
                                    <span className="ml-1 text-base opacity-50">/</span>
                                    <span className="ml-1 text-base opacity-50">{totalSections}</span>
                                    <span className="ml-2">→</span>
                                </span>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#262627] leading-tight">
                                    {currentSection.title}
                                </h1>
                            </div>

                            {currentSection.description && (
                                <p className="text-xl md:text-2xl font-light text-[#262627]/70 mt-2 pl-24 md:pl-0">
                                    {currentSection.description}
                                </p>
                            )}
                        </div>

                        {/* Form Fields Area */}
                        <div key={renderKey} className="space-y-8 w-full">
                            {currentSection.elements.map((element) => {
                                const FormElementDesc = FormElements[element.type];
                                if (!FormElementDesc) return null;

                                const FormElement = FormElementDesc.formComponent;
                                return (
                                    <div key={element.id} className="w-full group">
                                        {/* We might pass a special prop here in future for Typeform-specific styling if we modify the components directly */}
                                        <FormElement
                                            element={element}
                                            submitValue={submitValue}
                                            isInvalid={formErrors.current[element.id]}
                                            defaultValue={formValues.current[element.id]}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Area */}
                        <div className="mt-8">
                            <button
                                onClick={handleNext}
                                disabled={pending}
                                className="inline-flex items-center gap-2 bg-[#0445AF] hover:bg-[#03368a] text-white px-8 py-3 rounded text-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/10"
                            >
                                {isLastSection ? (pending ? "Submitting..." : "Submit") : "OK"}
                                {isLastSection ? <LuCheck className="w-6 h-6" /> : <LuCheck className="w-6 h-6" />}
                            </button>

                            <div className="inline-flex items-center gap-2 ml-4 text-xs font-medium text-[#262627]/50 uppercase tracking-widest hidden md:inline-flex">
                                press <span className="font-bold border-b border-[#262627]/30 pb-0.5">Enter ↵</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons (Bottom Right) */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
                <div className="flex rounded-md shadow-sm overflow-hidden bg-[#0445AF] text-white">
                    <button
                        onClick={handlePrevious}
                        disabled={isFirstSection}
                        className="p-3 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-black/10"
                    >
                        <LuChevronLeft className="w-5 h-5 md:rotate-90" />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={pending}
                        className="p-3 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <LuChevronRight className="w-5 h-5 md:rotate-90" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-4 right-8 z-20 text-[10px] text-[#262627]/30 hidden md:block">
                Powered by Superform
            </div>
        </div>
    );
}
