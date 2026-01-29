"use client";

import { FormElementHelper, FormElementInstance, FormElementType } from "@/types/form-builder";
import { TextFieldFormElement } from "./fields/TextField";
import { TextAreaFormElement } from "./fields/TextArea";
import { NumberFieldFormElement } from "./fields/NumberField";
import { DateFieldFormElement } from "./fields/DateField";
import { CheckboxFieldFormElement } from "./fields/CheckboxField";
import { SelectFieldFormElement } from "./fields/SelectField";

export const FormElements: Record<FormElementType, FormElementHelper> = {
    [FormElementType.TEXT_FIELD]: TextFieldFormElement,
    [FormElementType.NUMBER]: NumberFieldFormElement,
    [FormElementType.TEXTAREA]: TextAreaFormElement,
    [FormElementType.DATE]: DateFieldFormElement,
    [FormElementType.CHECKBOX]: CheckboxFieldFormElement,
    [FormElementType.SELECT]: SelectFieldFormElement,
};
