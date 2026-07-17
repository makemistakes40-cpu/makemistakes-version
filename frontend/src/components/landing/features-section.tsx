'use client';

import React from 'react';
import { Card } from '../ui/card';

const FEATURE_LIST = [
  {
    icon: '🎯',
    title: 'Error-Driven Learning',
    description: 'We analyze your compilation bugs and runtime errors to construct bite-sized, interactive coding lessons tailored for you.',
  },
  {
    icon: '⚡',
    title: 'AI Code Doctor',
    description: 'Instant feedback that explains the root cause of logic crashes. No more copying StackOverflow blindly — understand the why.',
  },
  {
    icon: '👔',
    title: 'Interviews & Jobs',
    description: 'Practice interactive resume reviews and role-play technical interview failures to polish communication skills.',
  },
  {
    icon: '📈',
    title: 'Mistake Analytics',
    description: 'Showcase your mistake solving index and debug logs to tech recruiters as verified proof of problem-solving adaptability.',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-brand-border/60">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white">
          Personalized coding tracks powered by logic checks
        </h2>
        <p className="text-sm sm:text-base text-brand-slate font-sans">
          How we translate your daily programming errors into skills ready for recruiters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURE_LIST.map((feat, idx) => (
          <Card key={idx} className="flex flex-col justify-between h-full bg-brand-card/40 border border-brand-border hover:border-brand-violet/40 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-[12px] bg-brand-card-light/65 border border-brand-border flex items-center justify-center text-2xl shadow-sm">
                {feat.icon}
              </div>
              <h3 className="font-sans font-bold text-lg text-white">
                {feat.title}
              </h3>
              <p className="text-xs text-brand-slate leading-relaxed font-sans">
                {feat.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
