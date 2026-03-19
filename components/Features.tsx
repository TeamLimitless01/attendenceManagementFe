"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ScanFace, FileSpreadsheet, Bell, ShieldCheck, Zap } from 'lucide-react';

const featureList = [
  {
    icon: <ScanFace className="w-6 h-6 text-blue-500" />,
    title: 'Facial Recognition',
    description: 'Instant verification using advanced AI facial recognition to prevent buddy punching.'
  },
  {
    icon: <MapPin className="w-6 h-6 text-purple-500" />,
    title: 'Geo-fencing',
    description: 'Restrict check-ins to specific office locations or project sites using GPS tracking.'
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-emerald-500" />,
    title: 'Automated Reports',
    description: 'Generate comprehensive timesheets and export them directly to your payroll system.'
  },
  {
    icon: <Bell className="w-6 h-6 text-amber-500" />,
    title: 'Smart Notifications',
    description: 'Real-time alerts for late arrivals, missing punch-ins, and overtime instances.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
    title: 'Compliance & Security',
    description: 'Enterprise-grade encryption and GDPR compliant data storage out of the box.'
  },
  {
    icon: <Zap className="w-6 h-6 text-cyan-500" />,
    title: 'Lightning Fast API',
    description: 'Integrate attendance data seamlessly into your existing HR tech stack via our API.'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-foreground/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">Everything you need to manage attendance</h2>
          <p className="text-lg text-foreground/60">
            Powerful features tightly integrated to give you the most seamless experience for tracking time and attendance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-background border border-foreground/10 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-foreground/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
