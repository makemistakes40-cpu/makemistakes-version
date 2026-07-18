'use client';

import React from 'react';
import { Navbar } from '../components/layout/navbar';
import { Footer } from '../components/layout/footer';
import { HeroSection } from '../components/landing/hero-section';
import { FeaturesSection } from '../components/landing/features-section';
import { JoinAccessSection } from '../components/landing/join-access-section';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-violet/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <HeroSection />

      <FeaturesSection />

      <JoinAccessSection />

      <Footer />

    </div>
  );
}
