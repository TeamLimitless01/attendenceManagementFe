import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AMS - Precision Attendance Management',
  description: 'Next-generation attendance tracking with AI facial recognition, geo-tracking, and real-time analytics.',
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <Hero />
        <Features />
        {/* <Pricing /> */}
        <FAQ />
        {/* <CTA /> */}
      </main>
      <Footer />
    </div>
  );
}