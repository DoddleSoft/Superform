"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { ClassicRenderer } from "@/components/renderers/ClassicRenderer";
import { TypeformRenderer } from "@/components/renderers/TypeformRenderer";
import {
  FormSection,
  FormElementType,
  FormDesignSettings,
  DEFAULT_DESIGN_SETTINGS,
} from "@/types/form-builder";

type FormStyleType = "classic" | "typeform";

// Demo form content for Classic style (all questions in one section)
const classicFormSections: FormSection[] = [
  {
    id: "section-1",
    title: "Get Started with Superform",
    description: "Join thousands of teams building beautiful forms",
    showTitle: false,
    rows: [
      {
        id: "row-1",
        elements: [
          {
            id: "heading-1",
            type: FormElementType.HEADING,
            extraAttributes: {
              title: "Start Your Free Trial",
              subtitle: "No credit card required. Get started in seconds.",
              level: "h2",
            },
          },
        ],
      },
      {
        id: "row-2",
        elements: [
          {
            id: "name",
            type: FormElementType.TEXT_FIELD,
            extraAttributes: {
              label: "Your Name",
              placeholder: "Enter your full name",
              required: true,
            },
          },
        ],
      },
      {
        id: "row-3",
        elements: [
          {
            id: "email",
            type: FormElementType.EMAIL,
            extraAttributes: {
              label: "Work Email",
              placeholder: "you@company.com",
              required: true,
            },
          },
        ],
      },
      {
        id: "row-4",
        elements: [
          {
            id: "company-size",
            type: FormElementType.SELECT,
            extraAttributes: {
              label: "Company Size",
              placeholder: "Select your company size",
              options: ["1-10", "11-50", "51-200", "201-500", "500+"],
              required: false,
            },
          },
        ],
      },
      {
        id: "row-5",
        elements: [
          {
            id: "use-case",
            type: FormElementType.RADIO_GROUP,
            extraAttributes: {
              label: "What will you use Superform for?",
              options: [
                "Lead Generation",
                "Customer Feedback",
                "Event Registration",
                "Job Applications",
                "Surveys & Research",
              ],
              required: false,
            },
          },
        ],
      },
    ],
  },
];

// Demo form content for Typeform style (one question per section)
const typeformSections: FormSection[] = [
  {
    id: "tf-section-1",
    title: "Welcome",
    showTitle: false,
    rows: [
      {
        id: "tf-row-1",
        elements: [
          {
            id: "tf-name",
            type: FormElementType.TEXT_FIELD,
            extraAttributes: {
              label: "First, what's your name?",
              placeholder: "Type your name here...",
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    id: "tf-section-2",
    title: "Email",
    showTitle: false,
    rows: [
      {
        id: "tf-row-2",
        elements: [
          {
            id: "tf-email",
            type: FormElementType.EMAIL,
            extraAttributes: {
              label: "Great! What's your work email?",
              placeholder: "you@company.com",
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    id: "tf-section-3",
    title: "Company",
    showTitle: false,
    rows: [
      {
        id: "tf-row-3",
        elements: [
          {
            id: "tf-company-size",
            type: FormElementType.RADIO_GROUP,
            extraAttributes: {
              label: "How big is your team?",
              options: ["Just me", "2-10", "11-50", "51-200", "200+"],
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    id: "tf-section-4",
    title: "Use Case",
    showTitle: false,
    rows: [
      {
        id: "tf-row-4",
        elements: [
          {
            id: "tf-use-case",
            type: FormElementType.RADIO_GROUP,
            extraAttributes: {
              label: "What will you use Superform for?",
              options: [
                "Lead Generation",
                "Customer Feedback",
                "Event Registration",
                "Surveys & Research",
                "Something else",
              ],
              required: true,
            },
          },
        ],
      },
    ],
  },
];

// Design settings for the demo
const demoDesignSettings: FormDesignSettings = {
  ...DEFAULT_DESIGN_SETTINGS,
  primaryColor: "#f05545",
  buttonColor: "#f05545",
  buttonTextColor: "#ffffff",
  fontFamily: "inter",
  buttonCornerRadius: "lg",
  questionSpacing: "normal",
  showSections: false,
};

export default function FormShowcase() {
  const [activeStyle, setActiveStyle] = useState<FormStyleType>("typeform");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const formValues = useRef<{ [key: string]: string }>({});
  const formErrors = useRef<{ [key: string]: boolean }>({});
  const [renderKey, setRenderKey] = useState(Date.now());

  const submitValue = (key: string, value: string) => {
    formValues.current[key] = value;
  };

  const handleSubmit = () => {
    // Demo - don't actually submit
  };

  const validateAllSections = () => true;
  const validateSection = () => true;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Form Styles
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content">
            Choose your{" "}
            <span className="text-primary">perfect style</span>
          </h2>
          <p className="mt-4 text-lg text-base-content/60 max-w-2xl mx-auto">
            Classic multi-field forms or modern one-question-at-a-time
            experience. You decide.
          </p>
        </motion.div>

        {/* Style Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex p-1 rounded-xl bg-base-200 border border-base-300/50">
            <button
              onClick={() => {
                setActiveStyle("typeform");
                setCurrentSectionIndex(0);
              }}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeStyle === "typeform"
                  ? "bg-primary text-primary-content shadow-lg"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Typeform Style
            </button>
            <button
              onClick={() => setActiveStyle("classic")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeStyle === "classic"
                  ? "bg-primary text-primary-content shadow-lg"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Classic Layout
            </button>
          </div>
        </motion.div>

        {/* Form Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />

          {/* Form Card - 16:9 ratio container */}
          <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-300/50 overflow-hidden">
            <div className="aspect-video overflow-y-auto">
              {activeStyle === "typeform" ? (
                <TypeformRenderer
                  sections={typeformSections}
                  formValues={formValues}
                  formErrors={formErrors}
                  renderKey={renderKey}
                  pending={false}
                  submitValue={submitValue}
                  handleSubmit={handleSubmit}
                  validateSection={validateSection}
                  setRenderKey={setRenderKey}
                  currentSectionIndex={currentSectionIndex}
                  onSectionChange={setCurrentSectionIndex}
                  designSettings={{
                    ...demoDesignSettings,
                    backgroundColor: "#ffffff",
                  }}
                />
              ) : (
                <ClassicRenderer
                  sections={classicFormSections}
                  formValues={formValues}
                  formErrors={formErrors}
                  renderKey={renderKey}
                  pending={false}
                  submitValue={submitValue}
                  handleSubmit={handleSubmit}
                  validateAllSections={validateAllSections}
                  setRenderKey={setRenderKey}
                  designSettings={demoDesignSettings}
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
