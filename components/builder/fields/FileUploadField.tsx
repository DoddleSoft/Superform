"use client";

import { FormElementInstance, FormElementType, FormElementHelper } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuUpload, LuFile, LuX, LuSettings, LuFileText, LuImage, LuLoader } from "react-icons/lu";
import { 
    PropertySection, 
    PropertyField, 
    PropertyToggle,
    PropertySelect,
} from "@/components/builder/properties";
import { uploadFormFile } from "@/actions/storage";

const type: FormElementType = FormElementType.FILE_UPLOAD;

// File type options
export type AcceptedFileType = "all" | "images" | "documents" | "pdf";

const FILE_TYPE_ACCEPT: Record<AcceptedFileType, string> = {
    all: "*/*",
    images: "image/jpeg,image/png,image/gif,image/webp",
    documents: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
};

const FILE_TYPE_LABELS: Record<AcceptedFileType, string> = {
    all: "All file types",
    images: "Images only (JPEG, PNG, GIF, WebP)",
    documents: "Documents (PDF, DOC, TXT, CSV, Excel)",
    pdf: "PDF only",
};

const extraAttributes = {
    label: "File Upload",
    helperText: "Upload a file",
    showHelperText: false,
    required: false,
    acceptedTypes: "all" as AcceptedFileType,
    maxFileSizeMB: 10,
    allowMultiple: false,
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    showHelperText: z.boolean(),
    required: z.boolean(),
    acceptedTypes: z.enum(["all", "images", "documents", "pdf"]),
    maxFileSizeMB: z.number().min(1).max(50),
    allowMultiple: z.boolean(),
});

export const FileUploadFormElement: FormElementHelper = {
    type,
    construct: (id: string) => ({
        id,
        type,
        extraAttributes,
    }),
    designerComponent: DesignerComponent,
    formComponent: FormComponent,
    propertiesComponent: PropertiesComponent,
    validate: (formElement: FormElementInstance, currentValue: string): boolean => {
        const element = formElement as CustomInstance;
        if (element.extraAttributes?.required) {
            // Value should be a JSON string with file info or a URL
            return currentValue.length > 0;
        }
        return true;
    },
    label: "File Upload",
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

// File info stored in form values
export interface UploadedFileInfo {
    url: string;
    name: string;
    size: number;
    type: string;
}

function DesignerComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, showHelperText, acceptedTypes, maxFileSizeMB, allowMultiple } = elementInstance.extraAttributes || extraAttributes;

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="label-text">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-base-300 rounded-lg p-4 bg-base-200/30">
                <div className="flex flex-col items-center gap-2 text-center">
                    <LuUpload className="w-8 h-8 text-base-content/40" />
                    <p className="text-sm text-base-content/60">
                        {allowMultiple ? "Drag files here or click to upload" : "Drag a file here or click to upload"}
                    </p>
                    <p className="text-xs text-base-content/40">
                        {FILE_TYPE_LABELS[acceptedTypes]} • Max {maxFileSizeMB}MB
                    </p>
                </div>
            </div>
            {showHelperText && helperText && (
                <p className="text-[0.8rem] text-base-content/70">{helperText}</p>
            )}
        </div>
    );
}

function FormComponent({
    element,
    submitValue,
    isInvalid,
    defaultValue,
}: {
    element: FormElementInstance;
    submitValue?: (key: string, value: string) => void;
    isInvalid?: boolean;
    defaultValue?: string;
}) {
    const elementInstance = element as CustomInstance;
    const { label, required, helperText, showHelperText, acceptedTypes, maxFileSizeMB, allowMultiple } = elementInstance.extraAttributes || extraAttributes;
    
    const [files, setFiles] = useState<UploadedFileInfo[]>(() => {
        if (defaultValue) {
            try {
                return JSON.parse(defaultValue);
            } catch {
                return [];
            }
        }
        return [];
    });
    const [error, setError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setError(isInvalid === true);
    }, [isInvalid]);

    const handleFileUpload = useCallback(async (fileList: FileList) => {
        const filesToUpload = Array.from(fileList);
        
        // Validate file sizes
        const oversizedFiles = filesToUpload.filter(f => f.size > maxFileSizeMB * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(true);
            return;
        }

        // Validate file types
        const acceptedMimeTypes = FILE_TYPE_ACCEPT[acceptedTypes].split(",");
        if (acceptedTypes !== "all") {
            const invalidFiles = filesToUpload.filter(f => !acceptedMimeTypes.some(mime => {
                if (mime === "*/*") return true;
                return f.type === mime || f.type.startsWith(mime.replace("/*", "/"));
            }));
            if (invalidFiles.length > 0) {
                setError(true);
                return;
            }
        }

        setUploading(true);
        setError(false);

        try {
            const uploadedFiles: UploadedFileInfo[] = [];
            
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append("file", file);
                
                const result = await uploadFormFile(formData);
                
                if (result.error) {
                    console.error("Upload error:", result.error);
                    setError(true);
                    continue;
                }
                
                if (result.url) {
                    uploadedFiles.push({
                        url: result.url,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    });
                }
            }

            const newFiles = allowMultiple ? [...files, ...uploadedFiles] : uploadedFiles;
            setFiles(newFiles);
            
            if (submitValue) {
                const valid = FileUploadFormElement.validate(elementInstance, JSON.stringify(newFiles));
                setError(!valid);
                submitValue(elementInstance.id, JSON.stringify(newFiles));
            }
        } catch (err) {
            console.error("Upload failed:", err);
            setError(true);
        } finally {
            setUploading(false);
        }
    }, [allowMultiple, files, maxFileSizeMB, acceptedTypes, submitValue, elementInstance]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    }, [handleFileUpload]);

    const handleRemoveFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        
        if (submitValue) {
            const valid = FileUploadFormElement.validate(elementInstance, JSON.stringify(newFiles));
            setError(!valid);
            submitValue(elementInstance.id, JSON.stringify(newFiles));
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <LuImage className="w-4 h-4" />;
        return <LuFileText className="w-4 h-4" />;
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <label className={`form-field-label text-base md:text-lg font-medium text-[#262627] ${error ? "text-error" : ""}`}>
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>

            {/* Upload Area */}
            <div
                className={`
                    border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
                    ${dragOver ? "border-[#0445AF] bg-[#0445AF]/5" : "border-[#262627]/20 hover:border-[#262627]/40"}
                    ${error ? "border-error" : ""}
                    ${uploading ? "pointer-events-none opacity-60" : ""}
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={FILE_TYPE_ACCEPT[acceptedTypes]}
                    multiple={allowMultiple}
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(e.target.files);
                        }
                        e.target.value = ""; // Reset to allow same file again
                    }}
                    disabled={uploading}
                />
                
                <div className="flex flex-col items-center gap-2 text-center">
                    {uploading ? (
                        <>
                            <LuLoader className="w-8 h-8 text-[#0445AF] animate-spin" />
                            <p className="text-sm text-[#262627]/60">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <LuUpload className="w-8 h-8 text-[#262627]/40" />
                            <p className="text-sm text-[#262627]/60">
                                {allowMultiple ? "Drag files here or click to upload" : "Drag a file here or click to upload"}
                            </p>
                            <p className="text-xs text-[#262627]/40">
                                {FILE_TYPE_LABELS[acceptedTypes]} • Max {maxFileSizeMB}MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div 
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 p-3 bg-[#262627]/5 rounded-lg"
                        >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#262627] truncate">{file.name}</p>
                                <p className="text-xs text-[#262627]/60">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(index);
                                }}
                                className="p-1 hover:bg-[#262627]/10 rounded transition-colors"
                            >
                                <LuX className="w-4 h-4 text-[#262627]/60" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showHelperText && helperText && (
                <p className={`form-field-helper text-sm text-[#262627]/60 ${error && "text-error"}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
}

type propertiesFormSchemaType = z.infer<typeof propertiesSchema>;

function PropertiesComponent({ element }: { element: FormElementInstance }) {
    const elementInstance = element as CustomInstance;
    const { updateElementById } = useFormBuilder();

    const defaults = elementInstance.extraAttributes || extraAttributes;

    const form = useForm<propertiesFormSchemaType>({
        resolver: zodResolver(propertiesSchema),
        mode: "onBlur",
        defaultValues: {
            label: defaults.label,
            helperText: defaults.helperText,
            showHelperText: defaults.showHelperText,
            required: defaults.required,
            acceptedTypes: defaults.acceptedTypes,
            maxFileSizeMB: defaults.maxFileSizeMB,
            allowMultiple: defaults.allowMultiple,
        },
    });

    useEffect(() => {
        form.reset(elementInstance.extraAttributes || extraAttributes);
    }, [element, form]);

    function applyChanges(values: propertiesFormSchemaType) {
        updateElementById(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                ...values,
            },
        });
    }

    const fileTypeOptions = [
        { value: "all", label: "All file types" },
        { value: "images", label: "Images only" },
        { value: "documents", label: "Documents" },
        { value: "pdf", label: "PDF only" },
    ];

    const fileSizeOptions = [
        { value: "5", label: "5 MB" },
        { value: "10", label: "10 MB" },
        { value: "25", label: "25 MB" },
        { value: "50", label: "50 MB" },
    ];

    return (
        <form onBlur={form.handleSubmit(applyChanges)}>
            <PropertySection title="Content" icon={<LuUpload className="w-3.5 h-3.5" />}>
                <PropertyField
                    label="Label"
                    description="The question or prompt shown to users"
                    {...form.register("label")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyField
                    label="Helper Text"
                    description="Additional guidance below the field"
                    {...form.register("helperText")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                />

                <PropertyToggle
                    label="Show Helper Text"
                    description="Display helper text below the field"
                    {...form.register("showHelperText")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>

            <PropertySection title="File Settings" icon={<LuFile className="w-3.5 h-3.5" />}>
                <PropertySelect
                    label="Accepted File Types"
                    description="Types of files users can upload"
                    options={fileTypeOptions}
                    {...form.register("acceptedTypes")}
                    onChange={(e) => {
                        form.setValue("acceptedTypes", e.target.value as AcceptedFileType);
                        form.handleSubmit(applyChanges)();
                    }}
                />

                <PropertySelect
                    label="Max File Size"
                    description="Maximum size per file"
                    options={fileSizeOptions}
                    {...form.register("maxFileSizeMB", { valueAsNumber: true })}
                    onChange={(e) => {
                        form.setValue("maxFileSizeMB", parseInt(e.target.value));
                        form.handleSubmit(applyChanges)();
                    }}
                />

                <PropertyToggle
                    label="Allow Multiple Files"
                    description="Let users upload more than one file"
                    {...form.register("allowMultiple")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>

            <PropertySection title="Validation" icon={<LuSettings className="w-3.5 h-3.5" />}>
                <PropertyToggle
                    label="Required"
                    description="Users must upload at least one file"
                    {...form.register("required")}
                    onToggleChange={() => form.handleSubmit(applyChanges)()}
                />
            </PropertySection>
        </form>
    );
}
