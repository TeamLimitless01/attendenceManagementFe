"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background dark:from-blue-950/40 dark:via-background dark:to-background -z-10" />
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>Introducing SyncRoll 2.0</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 leading-tight"
        >
          Attendance tracking, <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            effortless & precise.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10"
        >
          Automate your attendance workflows with AI-powered face recognition, geo-tracking, and real-time analytics. Say goodbye to manual roll calls.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/register" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25 w-full sm:w-auto">
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="#demo" className="h-14 px-8 bg-background border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 text-foreground rounded-full font-medium text-lg flex items-center justify-center transition-all w-full sm:w-auto">
            Book a Demo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-5xl"
        >
          {/* Dashboard Abstract visual */}
          <div className="rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent" />
             {/* Mock UI Elements */}
             <div className="w-full h-full p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-foreground/10 pb-4">
                   <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-full bg-blue-500/20" />
                     <div className="h-4 w-32 bg-foreground/10 rounded-full" />
                   </div>
                   <div className="flex gap-2">
                     <div className="h-8 w-24 bg-foreground/10 rounded-full" />
                     <div className="h-8 w-8 bg-foreground/10 rounded-full" />
                   </div>
                </div>
                <div className="flex-1 flex gap-6">
                  {/* Sidebar Mock */}
                   <div className="w-48 hidden md:flex flex-col gap-4 border-r border-foreground/10 pr-4">
                     {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-full bg-foreground/5 rounded-md" />)}
                   </div>
                   {/* Main Content Mock */}
                   <div className="flex-1 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4">
                         {[1,2,3].map(i => (
                           <div key={i} className="h-24 bg-foreground/5 rounded-xl border border-foreground/5 p-4 flex flex-col justify-end">
                             <div className="h-3 w-16 bg-foreground/10 rounded-full mb-2" />
                             <div className="h-6 w-24 bg-foreground/20 rounded-full" />
                           </div>
                         ))}
                      </div>
                      <div className="flex-1 bg-foreground/5 rounded-xl border border-foreground/5" />
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
