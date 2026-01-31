"use client";

import { FormElements } from "@/components/builder/FormElements";
import { FormElementInstance, FormSection, FormDesignSettings, DEFAULT_DESIGN_SETTINGS, FormRow, getSectionElements } from "@/types/form-builder";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuCheck, LuArrowDown, LuChevronDown } from "react-icons/lu";
import { useState, useRef, useEffect, useCallback } from "react";
import { getFormWrapperStyle, getButtonStyle, QUESTION_SPACING_MAP, getGoogleFontsUrl, FONT_FAMILY_MAP } from "@/lib/designUtils";

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
    designSettings?: Partial<FormDesignSettings>;
}

// Helper to render a form element
function TypeformFieldRenderer({
    element,
    submitValue,
    formErrors,
    formValues,
    settings,
    isHalfWidth = false,
}: {
    element: FormElementInstance;
    submitValue: (key: string, value: string) => void;
    formErrors: React.MutableRefObject<{ [key: string]: boolean }>;
    formValues: React.MutableRefObject<{ [key: string]: string }>;
    settings: FormDesignSettings;
    isHalfWidth?: boolean;
}) {
    const FormElementDesc = FormElements[element.type];
    if (!FormElementDesc) return null;

    const FormElement = FormElementDesc.formComponent;
    
    return (
        <div
            className={`group ${isHalfWidth ? 'flex-1 min-w-0' : 'w-full'}`}
            style={{
                '--form-primary-color': settings.primaryColor,
                '--form-text-color': settings.textColor,
            } as React.CSSProperties}
        >
            <FormElement
                element={element}
                submitValue={submitValue}
                isInvalid={formErrors.current[element.id]}
                defaultValue={formValues.current[element.id]}
            />
        </div>
    );
}

// Helper to render a row (1 or 2 elements side by side)
function TypeformRowRenderer({
    row,
    submitValue,
    formErrors,
    formValues,
    settings,
}: {
    row: FormRow;
    submitValue: (key: string, value: string) => void;
    formErrors: React.MutableRefObject<{ [key: string]: boolean }>;
    formValues: React.MutableRefObject<{ [key: string]: string }>;
    settings: FormDesignSettings;
}) {
    if (row.elements.length === 0) return null;
    
    const isSideBySide = row.elements.length === 2;
    
    return (
        <div className={isSideBySide ? 'flex gap-4 md:gap-6' : 'w-full'}>
            {row.elements.map((element) => (
                <TypeformFieldRenderer
                    key={element.id}
                    element={element}
                    submitValue={submitValue}
                    formErrors={formErrors}
                    formValues={formValues}
                    settings={settings}
                    isHalfWidth={isSideBySide}
                />
            ))}
        </div>
    );
}

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
    designSettings?: Partial<FormDesignSettings>;
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
    designSettings = {},
}: TypeformRendererProps) {
    // Filter out empty sections (sections with no elements)
    const nonEmptySections = sections.filter(section => getSectionElements(section).length > 0);
    
    const settings = { ...DEFAULT_DESIGN_SETTINGS, ...designSettings };
    const buttonStyle = getButtonStyle(settings);
    const questionSpacing = QUESTION_SPACING_MAP[settings.questionSpacing];

    // Load Google Font if needed
    useEffect(() => {
        const fontUrl = getGoogleFontsUrl(settings.fontFamily);
        if (fontUrl) {
            const linkId = `google-font-${settings.fontFamily}`;
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.href = fontUrl;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        }
    }, [settings.fontFamily]);

    const [internalIndex, setInternalIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Use controlled index if provided, otherwise internal state
    const currentSectionIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

    const currentSection = nonEmptySections[currentSectionIndex];
    const totalSections = nonEmptySections.length;
    const isFirstSection = currentSectionIndex === 0;
    const isLastSection = currentSectionIndex === totalSections - 1;

    // Check if content is scrollable and handle scroll state
    const checkScrollState = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // More robust scrollability check with a minimum threshold
        const scrollableAmount = container.scrollHeight - container.clientHeight;
        const isScrollable = scrollableAmount > 20; // Only consider scrollable if more than 20px to scroll
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        
        setShowScrollIndicator(isScrollable && !isAtBottom);
        setHasScrolledToBottom(!isScrollable || isAtBottom);
    }, []);

    // Reset scroll state when section changes
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTop = 0;
        }
        // Hide indicator initially, only show after confirming scroll is needed
        setShowScrollIndicator(false);
        setHasScrolledToBottom(true); // Assume no scroll needed initially
        
        // Check after animation completes to avoid flash
        const timer = setTimeout(checkScrollState, 650);
        return () => clearTimeout(timer);
    }, [currentSectionIndex, checkScrollState]);

    // Listen to scroll events
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener("scroll", checkScrollState);
        window.addEventListener("resize", checkScrollState);
        
        return () => {
            container.removeEventListener("scroll", checkScrollState);
            window.removeEventListener("resize", checkScrollState);
        };
    }, [checkScrollState]);

    // Smooth scroll down function
    const scrollDown = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        container.scrollBy({
            top: 200,
            behavior: "smooth"
        });
    };

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
        <div 
            className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ 
                backgroundColor: settings.backgroundColor,
                color: settings.textColor,
                fontFamily: FONT_FAMILY_MAP[settings.fontFamily],
            }}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-50">
                <div className="h-1" style={{ backgroundColor: `${settings.primaryColor}20` }}>
                    <motion.div
                        className="h-full"
                        style={{ backgroundColor: settings.primaryColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </div>

            {/* Main Content - Scrollable Container */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth typeform-scroll"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: `${settings.primaryColor}50 transparent`,
                }}
            >
                <div className="min-h-full flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-8 md:px-12 py-16 relative z-10">
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
                            {/* Section Question / Header - only show if showTitle is enabled */}
                            {currentSection.showTitle && (
                                <div>
                                    <h1 
                                        className="form-section-title text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4"
                                        style={{ color: settings.textColor }}
                                    >
                                        {currentSection.title}
                                    </h1>

                                    {currentSection.description && (
                                        <p 
                                            className="form-section-description text-xl md:text-2xl font-light mt-2 pl-24 md:pl-0"
                                            style={{ color: settings.textColor, opacity: 0.7 }}
                                        >
                                            {currentSection.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Form Fields Area - Using Rows */}
                            <div key={renderKey} style={{ display: 'flex', flexDirection: 'column', gap: questionSpacing }} className="w-full">
                                {currentSection.rows?.map((row) => (
                                    <TypeformRowRenderer
                                        key={row.id}
                                        row={row}
                                        submitValue={submitValue}
                                        formErrors={formErrors}
                                        formValues={formValues}
                                        settings={settings}
                                    />
                                ))}
                            </div>

                            {/* Action Area */}
                            <div className="mt-8">
                                <button
                                    onClick={handleNext}
                                    disabled={pending}
                                    className="inline-flex items-center gap-2 px-8 py-3 text-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                    style={buttonStyle}
                                >
                                    {isLastSection ? (pending ? "Submitting..." : "Submit") : "OK"}
                                    {isLastSection ? <LuCheck className="w-6 h-6" /> : <LuCheck className="w-6 h-6" />}
                                </button>

                                <div 
                                    className="inline-flex items-center gap-2 ml-4 text-xs font-medium uppercase tracking-widest hidden md:inline-flex"
                                    style={{ color: settings.textColor, opacity: 0.5 }}
                                >
                                    press <span className="font-bold border-b pb-0.5" style={{ borderColor: `${settings.textColor}30` }}>Enter ↵</span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Scroll Indicator - Shows when content is scrollable */}
            <AnimatePresence>
                {showScrollIndicator && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
                    >
                        <button
                            onClick={scrollDown}
                            className="flex flex-col items-center gap-1 transition-colors group"
                            style={{ color: settings.primaryColor, opacity: 0.7 }}
                        >
                            <span className="text-xs font-medium uppercase tracking-wider opacity-70 group-hover:opacity-100">
                                Scroll for more
                            </span>
                            <motion.div
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <LuChevronDown className="w-6 h-6" />
                            </motion.div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons (Bottom Right) */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
                <div 
                    className="flex rounded-md shadow-sm overflow-hidden"
                    style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}
                >
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

            <div 
                className="absolute bottom-4 right-8 z-20 text-[10px] hidden md:block"
                style={{ color: settings.textColor, opacity: 0.3 }}
            >
                Powered by Superform
            </div>
        </div>
    );
}
