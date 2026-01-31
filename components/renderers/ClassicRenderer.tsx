"use client";

import { FormElements } from "@/components/builder/FormElements";
import { FormElementInstance, FormSection, FormDesignSettings, DEFAULT_DESIGN_SETTINGS, FormRow, getSectionElements } from "@/types/form-builder";
import { motion } from "framer-motion";
import { LuCheck } from "react-icons/lu";
import { getFormWrapperStyle, getButtonStyle, QUESTION_SPACING_MAP, getGoogleFontsUrl } from "@/lib/designUtils";
import { useEffect } from "react";

interface ClassicRendererProps {
    sections: FormSection[];
    formValues: React.MutableRefObject<{ [key: string]: string }>;
    formErrors: React.MutableRefObject<{ [key: string]: boolean }>;
    renderKey: number;
    pending: boolean;
    submitValue: (key: string, value: string) => void;
    handleSubmit: () => void;
    validateAllSections: () => boolean;
    setRenderKey: (key: number) => void;
    designSettings?: Partial<FormDesignSettings>;
}

// Helper to render a form element
function FormFieldRenderer({
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
            className={isHalfWidth ? 'flex-1 min-w-0' : 'w-full'}
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
function FormRowRenderer({
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
        <div className={isSideBySide ? 'flex gap-4 md:gap-6' : ''}>
            {row.elements.map((element) => (
                <FormFieldRenderer
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

export function ClassicRenderer({
    sections,
    formValues,
    formErrors,
    renderKey,
    pending,
    submitValue,
    handleSubmit,
    validateAllSections,
    setRenderKey,
    designSettings = {},
}: ClassicRendererProps) {
    // Filter out empty sections (sections with no elements)
    const nonEmptySections = sections.filter(section => getSectionElements(section).length > 0);
    
    const settings = { ...DEFAULT_DESIGN_SETTINGS, ...designSettings };
    const wrapperStyle = getFormWrapperStyle(settings);
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

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAllSections()) {
            setRenderKey(new Date().getTime());
            return;
        }
        handleSubmit();
    };

    return (
        <div 
            className="min-h-screen py-8 px-4"
            style={wrapperStyle}
        >
            <div className="max-w-2xl mx-auto">
                <form onSubmit={onSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} key={renderKey}>
                        {settings.showSections ? (
                            // Sectioned layout with cards
                            nonEmptySections.map((section, sectionIndex) => (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: sectionIndex * 0.1 }}
                                    className="form-classic-card rounded-2xl shadow-xl p-8 md:p-12"
                                    style={{ 
                                        backgroundColor: 'white',
                                        border: `1px solid ${settings.primaryColor}20`,
                                    }}
                                >
                                    {/* Section Header - only show if showTitle is enabled */}
                                    {section.showTitle && (
                                        <div className="mb-8">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span 
                                                    className="text-xs font-bold uppercase tracking-wider"
                                                    style={{ color: settings.primaryColor, opacity: 0.7 }}
                                                >
                                                    Section {sectionIndex + 1}
                                                </span>
                                            </div>
                                            <h2 
                                                className="form-section-title text-2xl md:text-3xl font-bold mb-2"
                                                style={{ color: settings.textColor }}
                                            >
                                                {section.title}
                                            </h2>
                                            {section.description && (
                                                <p 
                                                    className="form-section-description"
                                                    style={{ color: settings.textColor, opacity: 0.6 }}
                                                >
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Form Rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: questionSpacing }}>
                                        {section.rows?.map((row) => (
                                            <FormRowRenderer
                                                key={row.id}
                                                row={row}
                                                submitValue={submitValue}
                                                formErrors={formErrors}
                                                formValues={formValues}
                                                settings={settings}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            // Flat page layout - all rows directly on the page
                            <div style={{ display: 'flex', flexDirection: 'column', gap: questionSpacing }}>
                                {nonEmptySections.flatMap((section) =>
                                    section.rows?.map((row) => (
                                        <FormRowRenderer
                                            key={row.id}
                                            row={row}
                                            submitValue={submitValue}
                                            formErrors={formErrors}
                                            formValues={formValues}
                                            settings={settings}
                                        />
                                    )) || []
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="submit"
                            className="btn btn-lg gap-2 px-8 font-semibold transition-all hover:scale-105 active:scale-95"
                            style={buttonStyle}
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
