"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ScanFace, FileSpreadsheet, Bell, ShieldCheck, Zap, ArrowRight, LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

const featureList: Feature[] = [
  {
    icon: ScanFace,
    iconColor: 'text-blue-500', 
    title: 'AI Facial Recognition',
    description: 'Instant verification using advanced AI facial recognition to prevent buddy punching and ensure security.'
  },
  {
    icon: MapPin,
    iconColor: 'text-purple-500',
    title: 'Precision Geo-fencing',
    description: 'Restrict check-ins to specific office locations or project sites using high-accuracy GPS tracking.'
  },
  {
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-500',
    title: 'Automated Reports',
    description: 'Generate comprehensive timesheets and export them directly as Excel or CSV for payroll systems.'
  },
  {
    icon: Bell,
    iconColor: 'text-amber-500',
    title: 'Smart Notifications',
    description: 'Real-time alerts for late arrivals, missing punch-ins, and upcoming lectures or shifts.'
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-rose-500',
    title: 'LMS Integration',
    description: 'Seamlessly manage subjects, classes, and lectures with our built-in Learning Management System.'
  },
  {
    icon: Zap,
    iconColor: 'text-cyan-500',
    title: 'Real-Time Analytics',
    description: 'Get instant insights into workforce productivity and attendance patterns with interactive dashboards.'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-32 bg-foreground/[0.02] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full dark:bg-blue-900/30 dark:text-blue-400"
          >
            Powerful Capabilities
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground tracking-tight">Everything you need in one place</h2>
          <p className="text-lg md:text-xl text-foreground/60 leading-relaxed">
            Our comprehensive attendance management system combines state-of-the-art AI with intuitive tools to streamline your administrative workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.21, 0.45, 0.32, 0.9] }}
              className="relative p-8 rounded-3xl bg-background border border-foreground/5 hover:border-blue-500/20 transition-colors group overflow-hidden"
            >
              {/* Card Hover Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
                  <feature.icon className={`w-7 h-7 ${feature.iconColor} group-hover:text-blue-600 transition-colors`} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground tracking-tight">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-base font-medium">
                  {feature.description}
                </p>
                
                <div className="mt-8 flex items-center text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  Learn more <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
              
              {/* Bottom Decorative Line */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 w-0 group-hover:w-full transition-all duration-700" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
