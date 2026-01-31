"use client";

import { useState, KeyboardEvent } from "react";
import { LuPlus, LuX, LuGripVertical } from "react-icons/lu";
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PropertyOptionsEditorProps {
    options: string[];
    onChange: (options: string[]) => void;
    placeholder?: string;
    maxOptions?: number;
}

export function PropertyOptionsEditor({
    options,
    onChange,
    placeholder = "Add option...",
    maxOptions = 20,
}: PropertyOptionsEditorProps) {
    const [newOption, setNewOption] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = options.findIndex((_, i) => `option-${i}` === active.id);
            const newIndex = options.findIndex((_, i) => `option-${i}` === over.id);
            onChange(arrayMove(options, oldIndex, newIndex));
        }
    };

    const addOption = () => {
        const trimmed = newOption.trim();
        if (trimmed && !options.includes(trimmed) && options.length < maxOptions) {
            onChange([...options, trimmed]);
            setNewOption("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addOption();
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        onChange(newOptions);
    };

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-base-content/80">
                    Options
                </span>
                <span className="text-[10px] text-base-content/50">
                    {options.length}/{maxOptions}
                </span>
            </label>

            {options.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={options.map((_, i) => `option-${i}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1.5">
                            {options.map((option, index) => (
                                <SortableOption
                                    key={`option-${index}`}
                                    id={`option-${index}`}
                                    index={index}
                                    value={option}
                                    onChange={(value) => updateOption(index, value)}
                                    onRemove={() => removeOption(index)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {options.length === 0 && (
                <div className="py-3 px-4 bg-base-200/30 rounded-lg text-center">
                    <p className="text-xs text-base-content/50">
                        No options yet. Add your first option below.
                    </p>
                </div>
            )}

            {options.length < maxOptions && (
                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="text"
                        className="input input-bordered input-sm flex-1 focus:input-primary"
                        placeholder={placeholder}
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-primary btn-square"
                        onClick={addOption}
                        disabled={!newOption.trim()}
                    >
                        <LuPlus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

interface SortableOptionProps {
    id: string;
    index: number;
    value: string;
    onChange: (value: string) => void;
    onRemove: () => void;
}

function SortableOption({ id, index, value, onChange, onRemove }: SortableOptionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-center gap-1.5 group
                ${isDragging ? "opacity-50" : ""}
            `}
        >
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60 transition-colors"
                {...attributes}
                {...listeners}
            >
                <LuGripVertical className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center justify-center w-5 h-5 rounded bg-base-200 text-[10px] font-bold text-base-content/50">
                {String.fromCharCode(65 + index)}
            </div>
            
            <input
                type="text"
                className="input input-bordered input-sm flex-1 focus:input-primary"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
            />
            
            <button
                type="button"
                className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 text-base-content/50 hover:text-error transition-all"
                onClick={onRemove}
            >
                <LuX className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
