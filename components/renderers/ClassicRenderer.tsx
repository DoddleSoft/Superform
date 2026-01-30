"use client";

import { FormElements } from "@/components/builder/FormElements";
import { FormElementInstance, FormSection } from "@/types/form-builder";
import { motion } from "framer-motion";
import { LuCheck } from "react-icons/lu";

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
}: ClassicRendererProps) {
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
                                className="form-classic-card bg-base-100 rounded-2xl shadow-xl p-8 md:p-12"
                            >
                                {/* Section Header */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                                            Section {sectionIndex + 1}
                                        </span>
                                    </div>
                                    <h2 className="form-section-title text-2xl md:text-3xl font-bold mb-2">
                                        {section.title}
                                    </h2>
                                    {section.description && (
                                        <p className="form-section-description text-base-content/60">
                                            {section.description}
                                        </p>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {section.elements.map((element) => {
                                        // Handle potential missing element types safely
                                        const FormElementDesc = FormElements[element.type];
                                        if (!FormElementDesc) return null;

                                        const FormElement = FormElementDesc.formComponent;
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
