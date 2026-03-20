"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients and Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background -z-10" />
      
      {/* Floating Blobs */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[100px] -z-10" 
      />
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 left-[5%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] -z-10" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        {/* <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-bold mb-8 shadow-sm backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>Next-Gen Attendance: AMS 2.0</span>
        </motion.div> */}

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="text-6xl md:text-8xl font-black tracking-tight text-foreground mb-10 leading-[0.9] md:leading-[0.85]"
        >
          Attendance tracking <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 drop-shadow-sm">
            Simplified.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="text-xl md:text-2xl text-foreground/60 max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
        >
          Level up your institution with AI-powered face recognition and real-time geo-tracking. No more manual logs—just pure efficiency.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
        >
          {/* <Link href="/register" className="group h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/30 w-full sm:w-auto">
            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link> */}
          <Link href="#features" className="h-16 px-10 bg-background border-2 border-foreground/5 hover:border-foreground/10 hover:bg-foreground/5 text-foreground rounded-2xl font-bold text-lg flex items-center justify-center transition-all w-full sm:w-auto">
            Explore Features
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="relative mx-auto w-full max-w-6xl group"
        >
          {/* Dashboard Abstract visual with better styling */}
          <div className="relative p-2 rounded-[2.5rem] bg-gradient-to-b from-foreground/10 to-transparent shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[21/9]">
            <div className="absolute inset-0 bg-background rounded-[2.3rem] overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
               
               {/* Mock UI Elements - Enhanced */}
               <div className="w-full h-full p-8 flex flex-col gap-8 opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="flex justify-between items-center border-b border-foreground/5 pb-6">
                     <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20" />
                       <div className="h-5 w-40 bg-foreground/10 rounded-full" />
                     </div>
                     <div className="flex gap-4">
                       <div className="h-10 w-32 bg-foreground/5 rounded-xl border border-foreground/5" />
                       <div className="h-10 w-10 bg-foreground/5 rounded-xl border border-foreground/5" />
                     </div>
                  </div>
                  <div className="flex-1 flex gap-8">
                     <div className="w-56 hidden md:flex flex-col gap-5 border-r border-foreground/5 pr-6">
                       {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-full bg-foreground/[0.03] rounded-xl" />)}
                     </div>
                     <div className="flex-1 flex flex-col gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {[1,2,3].map(i => (
                             <div key={i} className="h-32 bg-foreground/[0.02] rounded-3xl border border-foreground/5 p-6 flex flex-col justify-end relative overflow-hidden">
                               <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-500/10" />
                               <div className="h-3.5 w-20 bg-foreground/10 rounded-full mb-3" />
                               <div className="h-7 w-28 bg-foreground/20 rounded-full" />
                             </div>
                           ))}
                        </div>
                        <div className="flex-1 bg-foreground/[0.02] rounded-[2rem] border border-foreground/5 relative overflow-hidden">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-dashed border-foreground/10 rounded-full border-t-blue-500/20 animate-spin" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Floating Decorative UI Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-6 md:right-12 p-4 bg-background dark:bg-zinc-900 border border-foreground/5 rounded-2xl shadow-2xl z-20 hidden sm:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Attendance</span>
                <span className="text-sm font-bold">Verified 99.8%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
