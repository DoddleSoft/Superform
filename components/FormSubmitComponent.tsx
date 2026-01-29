"use client";

import { FormElementInstance, FormElementType } from "@/types/form-builder";
import { FormElements } from "@/components/builder/FormElements";
import { useRef, useState, useTransition } from "react";
import { submitForm } from "@/actions/form";

export function FormSubmitComponent({
    formUrl,
    formId,
    content,
}: {
    formUrl: string;
    formId: string;
    content: FormElementInstance[];
}) {
    const formValues = useRef<{ [key: string]: string }>({});
    const formErrors = useRef<{ [key: string]: boolean }>({});
    const [renderKey, setRenderKey] = useState(new Date().getTime());
    const [submitted, setSubmitted] = useState(false);
    const [pending, startTransition] = useTransition();

    const validateForm = () => {
        for (const field of content) {
            const actualValue = formValues.current[field.id] || "";
            const valid = FormElements[field.type].validate(field, actualValue);

            if (!valid) {
                formErrors.current[field.id] = true;
            }
        }

        if (Object.keys(formErrors.current).length > 0) {
            return false;
        }
        return true;
    };

    const submitValue = (key: string, value: string) => {
        formValues.current[key] = value;
    };

    const handleSubmit = async () => {
        formErrors.current = {};
        const validForm = validateForm();
        if (!validForm) {
            setRenderKey(new Date().getTime());
            alert("Please check the form for errors");
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

    if (submitted) {
        return (
            <div className="flex justify-center w-full h-full items-center p-8">
                <div className="max-w-[620px] flex flex-col gap-4 flex-grow bg-base-100 w-full p-8 overflow-y-auto border shadow-xl rounded">
                    <h1 className="text-2xl font-bold">Form Submitted</h1>
                    <p className="text-muted-foreground">
                        Thank you for submitting the form, you can close this page now.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center w-full h-full items-center p-8">
            <div
                key={renderKey}
                className="max-w-[620px] flex flex-col gap-4 flex-grow bg-base-100 w-full p-8 overflow-y-auto border shadow-xl rounded"
            >
                {content.map((element) => {
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
                <button
                    className="btn btn-primary mt-8"
                    onClick={handleSubmit}
                    disabled={pending}
                >
                    {pending ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}
