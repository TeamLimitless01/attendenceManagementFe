"use client"
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600 -z-10">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 to-transparent opacity-30" />
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">Ready to modernize your team?</h2>
          <p className="text-blue-100 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-medium opacity-90">
            Join thousands of forward-thinking institutions already using AMS to simplify their workday and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register" className="h-16 px-10 bg-white text-blue-600 rounded-2xl font-bold text-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl w-full sm:w-auto">
              Get Started Now
            </Link>
            <Link href="/login" className="h-16 px-10 bg-blue-700/50 backdrop-blur-md text-white rounded-2xl font-bold text-xl flex items-center justify-center transition-all hover:bg-blue-700 border border-blue-400/30 w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative shapes for CTA */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
    </section>
  );
};

export default CTA;
