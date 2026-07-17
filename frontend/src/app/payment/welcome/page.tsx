'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/layout/navbar';
import { Footer } from '../../../components/layout/footer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { motion } from 'framer-motion';

const PRO_FEATURES = [
  { icon: '🚀', title: 'Unlimited Learning Paths', desc: 'Generate multiple roadmaps for various stacks and dream roles.' },
  { icon: '🤖', title: 'Unlimited AI Tutor Checks', desc: 'Explain your compiler bugs and get instant guidance on mistakes.' },
  { icon: '🎯', title: 'System Design Mock Labs', desc: 'Practice mock environments to target scale problems and solutions.' },
  { icon: '💻', title: 'Capstone Recruiter Projects', desc: 'Build production-ready code with secure configurations and PDF documentation.' },
  { icon: '🔥', title: 'Recruiter Pipelines', desc: 'Direct access to recruiter searches and internship notifications.' },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground overflow-hidden relative">
      <Navbar />

      {/* Decorative particle glow shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-violet/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-violet/5 blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow flex flex-col items-center justify-center relative z-10">
        
        <div className="text-center space-y-6 max-w-xl mx-auto mb-12">
          {/* Animated celebration shield */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="inline-flex h-20 w-20 items-center justify-center bg-brand-violet/15 border-2 border-brand-violet rounded-full text-4xl shadow-xl shadow-brand-violet/10"
          >
            🎉
          </motion.div>

          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-display font-black text-white"
            >
              Welcome to MakeMistakes Pro
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-brand-slate leading-relaxed"
            >
              Your transaction is verified! All premium features, diagnostic sandboxes, and recruiter pipelines are unlocked.
            </motion.p>
          </div>
        </div>

        {/* Unlocked features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-12"
        >
          {PRO_FEATURES.map((feature, idx) => (
            <Card
              key={idx}
              className="bg-brand-card/80 border border-brand-border p-5 flex items-start space-x-4 hover:border-brand-violet/40 transition-colors duration-300"
            >
              <span className="text-2xl mt-0.5">{feature.icon}</span>
              <div className="space-y-1">
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  {feature.title}
                </h4>
                <p className="text-[11px] text-brand-slate leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Call to action button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center w-full"
        >
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-xs font-bold text-sm tracking-wide py-3 px-8"
          >
            Enter Pro Academy
          </Button>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}
