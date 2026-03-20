"use client"
import React from 'react';
import Link from 'next/link';
import { Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-background py-16 px-4 sm:px-6 lg:px-8 border-t border-foreground/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <Link href="/" className="flex items-center space-x-3 group mb-8">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20"
            >
              <Fingerprint className="w-7 h-7 text-white" />
            </motion.div>
            <span className="font-black text-3xl tracking-tighter text-foreground">AMS</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <p className="text-foreground/60 text-base font-medium max-w-sm">
              Simplifying attendance for modern institutions.
            </p>
            <div className="h-px w-12 bg-foreground/10 mx-auto" />
            <p className="text-foreground/30 text-xs font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} AMS. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
