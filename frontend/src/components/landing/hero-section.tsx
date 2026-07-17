'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { AnimatedCodePanel } from '../dynamic/animated-code-panel';

const HERO_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
} as const;

export function HeroSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 flex flex-col items-center text-center">
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={HERO_VARIANTS}
        className="space-y-6 max-w-3xl"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-violet/10 border border-brand-violet/20 text-xs font-sans font-semibold text-brand-violet">
          <span>✨ Reimagining developer learning</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-white leading-[1.1]">
          The best developers are built on{' '}
          <span className="bg-gradient-to-r from-white via-brand-slate to-brand-violet bg-clip-text text-transparent">Mistakes.</span>
        </h1>

        <p className="text-base sm:text-lg text-brand-slate max-w-2xl mx-auto leading-relaxed font-sans">
          Stop avoiding compiler bugs. MakeMistakes is an AI-guided platform that turns code failures, syntax crashes, and logic bugs into interactive programming lessons.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto font-sans">
              Start Learning Free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto font-sans">
              Sign In to Account
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Dynamic Coding Sandbox Simulator */}
      <div className="w-full max-w-4xl mt-16 relative z-10 px-2">
        <AnimatedCodePanel />
      </div>

    </section>
  );
}

export default HeroSection;
