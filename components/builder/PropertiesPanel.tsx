"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElements } from "./FormElements";
import { LuX, LuSettings } from "react-icons/lu";
import { motion, AnimatePresence, scaleIn } from "@/lib/animations";

export function PropertiesPanel() {
    const { selectedElement, removeElement, setSelectedElement } = useFormBuilder();

    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-base-100 border-l border-base-200 flex flex-col overflow-hidden"
        >
            <AnimatePresence mode="wait">
                {!selectedElement ? (
                    <motion.div
                        key="empty"
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex-1 flex flex-col items-center justify-center p-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
                            <LuSettings className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-bold text-base-content/70">No Element Selected</p>
                        <p className="text-sm text-base-content/50 mt-1 max-w-[200px]">
                            Click on an element in the canvas to edit its properties
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={selectedElement.id}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-50/50 shrink-0">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                                    Properties
                                </h3>
                                <p className="text-xs text-base-content/50 truncate w-[180px]">
                                    {FormElements[selectedElement.type].label}
                                </p>
                            </div>
                            <button
                                className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
                                onClick={() => setSelectedElement(null)}
                            >
                                <LuX />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            {(() => {
                                const PropertiesComponent = FormElements[selectedElement.type].propertiesComponent;
                                return <PropertiesComponent element={selectedElement} />;
                            })()}

                            <div className="divider my-6"></div>

                            <button
                                className="btn btn-error btn-outline btn-sm w-full gap-2"
                                onClick={() => {
                                    removeElement(selectedElement.id);
                                }}
                            >
                                Delete Element
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
    );
}
