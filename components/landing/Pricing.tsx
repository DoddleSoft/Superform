"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Up to 3 forms",
      "100 submissions/month",
      "Basic form fields",
      "Classic form layout",
      "Email notifications",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "$19",
    period: "per month",
    features: [
      "Unlimited forms",
      "10,000 submissions/month",
      "All form fields",
      "Classic + Typeform layouts",
      "AI form builder",
      "Advanced analytics",
      "Partial submissions",
      "Custom branding",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large teams",
    price: "Custom",
    period: "contact us",
    features: [
      "Everything in Pro",
      "Unlimited submissions",
      "Multiple workspaces",
      "Team collaboration",
      "SSO & SAML",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-content">
            Simple,{" "}
            <span className="text-primary">
              transparent pricing
            </span>
          </h2>
          <p className="mt-4 text-lg text-base-content/60 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade as you
            grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-content text-sm font-medium shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`h-full p-8 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? "bg-base-100 border-primary/50 shadow-2xl shadow-primary/10"
                    : "bg-base-100 border-base-300/50 hover:border-primary/20 hover:shadow-xl"
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-base-content mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-base-content/60 text-sm">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-base-content">
                      {plan.price}
                    </span>
                    <span className="text-base-content/60 ml-2">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-base-content/70 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/sign-up"
                  className={`btn w-full ${
                    plan.popular ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Link */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 text-base-content/60"
        >
          Have questions?{" "}
          <a href="#" className="text-primary hover:underline font-medium">
            Check our FAQ
          </a>{" "}
          or{" "}
          <a href="#" className="text-primary hover:underline font-medium">
            contact us
          </a>
        </motion.p>
      </div>
    </section>
  );
}
