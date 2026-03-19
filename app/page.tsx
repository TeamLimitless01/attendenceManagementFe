import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SyncRoll - Next Gen Attendance Management',
  description: 'Automate attendance tracking with AI facial recognition, geo-fencing, and precise real-time analytics.',
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        {/* Call to action section */}
        <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent opacity-50"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to modernize your team?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of forward-thinking companies already using SyncRoll to simplify their workday.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="h-14 px-8 bg-white text-blue-600 rounded-full font-bold text-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl w-full sm:w-auto">
                Get Started Now
              </a>
              <a href="#demo" className="h-14 px-8 bg-blue-700 text-white rounded-full font-bold text-lg flex items-center justify-center transition-colors hover:bg-blue-800 border border-blue-500 w-full sm:w-auto">
                Contact Sales
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}