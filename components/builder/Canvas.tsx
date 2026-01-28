"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";

export function Canvas() {
    const { elements, setSelectedElement, selectedElement } = useFormBuilder();

    return (
        <div className="flex-1 bg-base-200 h-full p-8 overflow-y-auto flex justify-center">
            <div className="bg-white w-full max-w-2xl min-h-[500px] rounded-lg shadow-sm p-8 flex flex-col gap-4 border border-base-300">
                {elements.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-base-content/30 border-2 border-dashed border-base-300 rounded-lg">
                        Drag elements here or click to add
                    </div>
                ) : (
                    elements.map((el) => (
                        <div
                            key={el.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${selectedElement?.id === el.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-base-100"
                                }`}
                            onClick={() => setSelectedElement(el)}
                        >
                            <label className="label cursor-pointer pointer-events-none">
                                <span className="label-text font-semibold">{el.label} {el.required && <span className="text-error">*</span>}</span>
                            </label>
                            <div className="pointer-events-none opacity-50">
                                {/* Visual Representation Placeholder */}
                                <input
                                    type="text"
                                    className="input input-bordered w-full input-sm"
                                    placeholder={el.placeholder || "Input placeholder..."}
                                    disabled
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
