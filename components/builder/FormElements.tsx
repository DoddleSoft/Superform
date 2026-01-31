"use client";

import { FormElementHelper, FormElementInstance, FormElementType } from "@/types/form-builder";
import { TextFieldFormElement } from "./fields/TextField";
import { TextAreaFormElement } from "./fields/TextArea";
import { NumberFieldFormElement } from "./fields/NumberField";
import { DateFieldFormElement } from "./fields/DateField";
import { CheckboxFieldFormElement } from "./fields/CheckboxField";
import { SelectFieldFormElement } from "./fields/SelectField";
import { EmailFieldFormElement } from "./fields/EmailField";
import { PhoneFieldFormElement } from "./fields/PhoneField";
import { RadioGroupFormElement } from "./fields/RadioGroup";
import { CheckboxGroupFormElement } from "./fields/CheckboxGroup";
import { RatingFieldFormElement } from "./fields/RatingField";
import { YesNoFieldFormElement } from "./fields/YesNoField";
import { HeadingFieldFormElement } from "./fields/HeadingField";
import { RichTextFieldFormElement } from "./fields/RichTextField";
import { FileUploadFormElement } from "./fields/FileUploadField";

export const FormElements: Record<FormElementType, FormElementHelper> = {
    [FormElementType.TEXT_FIELD]: TextFieldFormElement,
    [FormElementType.NUMBER]: NumberFieldFormElement,
    [FormElementType.TEXTAREA]: TextAreaFormElement,
    [FormElementType.DATE]: DateFieldFormElement,
    [FormElementType.CHECKBOX]: CheckboxFieldFormElement,
    [FormElementType.SELECT]: SelectFieldFormElement,
    [FormElementType.EMAIL]: EmailFieldFormElement,
    [FormElementType.PHONE]: PhoneFieldFormElement,
    [FormElementType.RADIO_GROUP]: RadioGroupFormElement,
    [FormElementType.CHECKBOX_GROUP]: CheckboxGroupFormElement,
    [FormElementType.RATING]: RatingFieldFormElement,
    [FormElementType.YES_NO]: YesNoFieldFormElement,
    [FormElementType.HEADING]: HeadingFieldFormElement,
    [FormElementType.RICH_TEXT]: RichTextFieldFormElement,
    [FormElementType.FILE_UPLOAD]: FileUploadFormElement,
};
