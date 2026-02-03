"use client";

import { motion } from "framer-motion";
import {
  MousePointerClick,
  Sparkles,
  LayoutTemplate,
  BarChart3,
  Layers,
  Globe,
  Palette,
  Save,
} from "lucide-react";

const features = [
  {
    icon: MousePointerClick,
    title: "Drag & Drop Builder",
    description:
      "Intuitive drag-and-drop interface to build forms visually. No coding required.",
    color: "bg-blue-500",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Creation",
    description:
      "Let AI help you create forms faster. Describe what you need and watch the magic happen.",
    color: "bg-purple-500",
  },
  {
    icon: LayoutTemplate,
    title: "Multiple Form Styles",
    description:
      "Choose between classic layouts or modern Typeform-style conversational forms.",
    color: "bg-primary",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track submissions, completion rates, and gain insights with beautiful dashboards.",
    color: "bg-emerald-500",
  },
  {
    icon: Layers,
    title: "Workspace Organization",
    description:
      "Organize forms into workspaces. Perfect for teams and multiple projects.",
    color: "bg-indigo-500",
  },
  {
    icon: Globe,
    title: "Easy Publishing",
    description:
      "Share forms with a link or embed them anywhere. Go live in seconds.",
    color: "bg-teal-500",
  },
  {
    icon: Palette,
    title: "Customizable Design",
    description:
      "Full control over colors, fonts, and branding to match your style.",
    color: "bg-rose-500",
  },
  {
    icon: Save,
    title: "Partial Submissions",
    description:
      "Never lose a lead. Capture partial responses even if users don't complete the form.",
    color: "bg-amber-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content">
            Everything you need to{" "}
            <span className="text-primary">
              create amazing forms
            </span>
          </h2>
          <p className="mt-4 text-lg text-base-content/60 max-w-2xl mx-auto">
            Powerful features designed to help you build, publish, and analyze
            forms with ease.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-2xl bg-base-100 border border-base-300/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-base-content mb-2">
                  {feature.title}
                </h3>
                <p className="text-base-content/60 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div
                  className={`absolute inset-0 rounded-2xl ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
