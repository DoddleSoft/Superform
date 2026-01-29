"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance } from "@/types/form-builder";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormElements } from "./FormElements";

export function Canvas() {
    const { elements, setSelectedElement } = useFormBuilder(); // added setSelectedElement to clear selection on background click
    const { setNodeRef } = useDroppable({
        id: "canvas-droppable",
        data: {
            isDesignerDropArea: true,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 bg-base-200 h-full p-8 overflow-y-auto flex justify-center"
            onClick={() => setSelectedElement(null)}
        >
            <div
                className="bg-white w-full max-w-2xl min-h-[500px] rounded-lg shadow-sm p-8 flex flex-col gap-4 border border-base-300"
                onClick={(e) => e.stopPropagation()} // Stop propagation so background click doesn't trigger parent click
            >
                {elements.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-base-content/30 border-2 border-dashed border-base-300 rounded-lg">
                        Drag elements here or click to add
                    </div>
                ) : (
                    <SortableContext items={elements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
                        {elements.map((el) => (
                            <SortableElement key={el.id} element={el} />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
}

function SortableElement({ element }: { element: FormElementInstance }) {
    const { selectedElement, setSelectedElement } = useFormBuilder();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: element.id,
        data: {
            type: element.type,
            element,
            isDesignerElement: true,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const DesignerComponent = FormElements[element.type].designerComponent;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 p-4 rounded-lg border-2 border-primary bg-base-100 h-[100px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 relative ${selectedElement?.id === element.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-base-100"
                }`}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
            }}
        >
            {/* Overlay to prevent interaction with form fields during design */}
            <div className="absolute inset-0 w-full h-full z-10" />
            <DesignerComponent element={element} />
        </div>
    );
}
