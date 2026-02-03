"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechFlow",
    avatar: "SC",
    content:
      "Superform has completely transformed how we collect feedback. The AI-powered form creation is a game-changer. What used to take hours now takes minutes.",
    rating: 5,
    color: "bg-rose-500",
  },
  {
    name: "Marcus Johnson",
    role: "Founder & CEO",
    company: "StartupHub",
    avatar: "MJ",
    content:
      "The Typeform-style layout increased our survey completion rates by 40%. The analytics dashboard gives us exactly the insights we need.",
    rating: 5,
    color: "bg-blue-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director",
    company: "GrowthLabs",
    avatar: "ER",
    content:
      "Beautiful forms, powerful analytics, and incredible ease of use. Superform is now essential to our lead generation strategy.",
    rating: 5,
    color: "bg-purple-500",
  },
  {
    name: "David Kim",
    role: "Operations Manager",
    company: "ScaleUp Inc",
    avatar: "DK",
    content:
      "The workspace feature is perfect for our team. We can organize forms by project and collaborate seamlessly. Highly recommended!",
    rating: 5,
    color: "bg-emerald-500",
  },
  {
    name: "Lisa Thompson",
    role: "HR Director",
    company: "PeopleFirst",
    avatar: "LT",
    content:
      "We use Superform for employee surveys and onboarding. The partial submissions feature ensures we never lose valuable feedback.",
    rating: 5,
    color: "bg-amber-500",
  },
  {
    name: "Alex Martinez",
    role: "UX Designer",
    company: "DesignStudio",
    avatar: "AM",
    content:
      "As a designer, I appreciate the attention to detail. The forms are beautiful out of the box, and customization options are endless.",
    rating: 5,
    color: "bg-teal-500",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 bg-base-200/30 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
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
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content">
            Loved by teams{" "}
            <span className="text-primary">
              worldwide
            </span>
          </h2>
          <p className="mt-4 text-lg text-base-content/60 max-w-2xl mx-auto">
            See what our customers have to say about their experience with
            Superform.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-base-100 border border-base-300/50 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-base-content/80 leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-semibold`}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-base-content">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
