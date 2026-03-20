"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small teams and startups looking to automate basic attendance.',
    features: ['Up to 50 Users', 'Basic Facial Recognition', 'Daily Reports', 'Standard GPS Tracking', 'Email Support'],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'Advanced features for growing institutions and medium enterprises.',
    features: ['Up to 500 Users', 'High-Precision AI Face Match', 'Advanced LMS Integration', 'Geo-fencing & GPS Logs', 'Priority Support', 'Custom Export Formats'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Full-scale solution for large universities and global corporations.',
    features: ['Unlimited Users', 'Dedicated AI Model Training', 'Full API Access', 'SLA Guaranteed Uptime', 'Dedicated Account Manager', 'Custom 3rd Party Integrations'],
    cta: 'Contact Sales',
    popular: false
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-8 text-foreground tracking-tighter"
          >
            Simple, Transparent <br className="hidden md:block"/>
            <span className="text-blue-600">Pricing for Everyone</span>
          </motion.h2>
          <p className="text-lg md:text-xl text-foreground/60 leading-relaxed font-medium">
            Choose the perfect plan for your institution. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative p-8 rounded-3xl border-2 flex flex-col ${tier.popular ? 'border-blue-600 bg-blue-50/5 shadow-2xl scale-105 z-10' : 'border-foreground/5 bg-background shadow-xl'}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 text-foreground uppercase tracking-wider">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-foreground/40 font-bold">/mo</span>}
                </div>
                <p className="text-foreground/60 text-sm font-medium leading-relaxed">{tier.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex gap-3 text-sm font-bold text-foreground/80">
                    <Check className={`w-5 h-5 flex-shrink-0 ${tier.popular ? 'text-blue-600' : 'text-foreground/20'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                href={tier.name === 'Enterprise' ? '/contact' : '/register'} 
                className={`h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all active:scale-95 ${tier.popular ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
