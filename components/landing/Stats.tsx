"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "10K+",
    label: "Forms Created",
    description: "And counting every day",
  },
  {
    value: "1M+",
    label: "Submissions",
    description: "Responses collected",
  },
  {
    value: "99.9%",
    label: "Uptime",
    description: "Reliable & always on",
  },
  {
    value: "4.9/5",
    label: "User Rating",
    description: "From happy customers",
  },
];

export default function Stats() {
  return (
    <section className="py-16 border-y border-base-300/50 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-base-content font-semibold mb-1">
                {stat.label}
              </div>
              <div className="text-base-content/60 text-sm">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
