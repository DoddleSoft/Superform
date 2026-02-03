"use client";

import { motion } from "framer-motion";
import { PenLine, Wand2, Share2, BarChart } from "lucide-react";

const steps = [
  {
    icon: PenLine,
    step: "01",
    title: "Create Your Form",
    description:
      "Start from scratch or use AI to generate your form. Add fields with simple drag and drop.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Wand2,
    step: "02",
    title: "Customize Design",
    description:
      "Choose your form style, customize colors, add branding, and make it uniquely yours.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: Share2,
    step: "03",
    title: "Publish & Share",
    description:
      "Get a shareable link instantly. Embed on your website or share directly with your audience.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    icon: BarChart,
    step: "04",
    title: "Analyze Results",
    description:
      "Track responses in real-time. View analytics, export data, and gain valuable insights.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-base-200/30 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content">
            From idea to form in{" "}
            <span className="text-primary">
              4 simple steps
            </span>
          </h2>
          <p className="mt-4 text-lg text-base-content/60 max-w-2xl mx-auto">
            Building forms has never been easier. Follow these simple steps to
            create, customize, and share your forms.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-base-300 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className={`relative p-6 rounded-2xl bg-base-100 border ${step.borderColor} hover:shadow-xl transition-all duration-300`}
                >
                  {/* Step Number */}
                  <div
                    className={`absolute -top-3 -right-3 w-12 h-12 rounded-full ${step.bgColor} ${step.color} flex items-center justify-center font-bold text-lg border-4 border-base-100`}
                  >
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-xl ${step.bgColor} ${step.color} mb-4`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-base-content mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base-content/60 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow - Hidden on last item */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className={`w-8 h-8 rounded-full ${step.bgColor} flex items-center justify-center`}>
                      <svg
                        className={`w-4 h-4 ${step.color}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
