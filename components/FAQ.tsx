"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "How accurate is the AI facial recognition?",
    answer: "Our facial recognition algorithms boast a 99.8% accuracy rate using state-of-the-art neural networks. It handles various lighting conditions, eyewear, and facial hair while preventing 'spoofing' attempts with liveness detection."
  },
  {
    question: "Can we use it for remote or field work?",
    answer: "Absolutely. AMS includes precision geo-fencing and GPS tracking. You can define authorized project sites or office locations, and the app ensures that check-ins only happen within those boundaries."
  },
  {
    question: "Does it work offline if there's no internet?",
    answer: "AMS requires a stable connection for real-time verification. However, we have a buffered mode for local caching that synchronizes attendance data once the connection is restored, ideal for remote sites with intermittent signal."
  },
  {
    question: "How do we export the reports for payroll?",
    answer: "Administrators can generate reports directly from the dashboard. You can export data in CSV, Excel, or PDF formats, and our API allows for direct integration with major HR management tools."
  },
  {
    question: "Is our data secure and GDPR compliant?",
    answer: "Yes, data security is our top priority. All facial biometric data is hashed and encrypted. We are fully GDPR compliant and take an anonymized approach to data storage where possible."
  }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-foreground/[0.02] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full dark:bg-blue-900/30 dark:text-blue-400"
          >
            <HelpCircle className="w-4 h-4" /> Got Questions?
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-foreground tracking-tighter">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 md:p-8 rounded-3xl transition-all border-2 ${activeIndex === index ? 'bg-background border-blue-500/20 shadow-xl shadow-blue-500/5' : 'bg-background border-foreground/5 hover:border-foreground/10'}`}
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-xl md:text-2xl font-bold text-foreground pr-8 tracking-tight">{faq.question}</span>
                <ChevronDown className={`w-6 h-6 text-foreground/40 transition-transform duration-300 ${activeIndex === index ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-lg text-foreground/60 leading-relaxed font-medium">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
