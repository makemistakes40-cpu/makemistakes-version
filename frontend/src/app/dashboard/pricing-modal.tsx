'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free-tier-plan-id',
    name: 'Free Plan',
    price: '$0',
    billing: 'forever',
    description: 'Basic onboarding path to learn fundamental programming concepts.',
    features: [
      'Conversational AI Onboarding',
      'Stage 1 Learning Roadmap',
      '5 Daily AI Code Checks',
      'Global Competitive Leaderboard',
    ],
  },
  {
    id: 'pro-tier-plan-id',
    name: 'Pro Member',
    price: '$15',
    billing: 'per month',
    description: 'The ultimate path to system architecture and recruiter assignments.',
    features: [
      'Unlock all 4 learning stages',
      'Unlimited daily AI diagnostics',
      'Verified digital completion certificate',
      'Priority recruiter matching pipeline',
      'Exclusive fullstack labs & mock interviews',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise-tier-plan-id',
    name: 'Enterprise',
    price: '$99',
    billing: 'per month',
    description: 'Custom mentorship and bulk licensing for colleges or startups.',
    features: [
      'Everything in Pro Plan',
      '1-on-1 code reviews with mentors',
      'Custom workspace learning path builder',
      'College-wide dashboard access & analytics',
      'SSO & advanced enterprise security',
    ],
  },
];

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

export function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Pricing Box Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-brand-card/95 border border-brand-border p-8 rounded-3xl w-full max-w-5xl z-10 relative overflow-hidden my-8"
          >
            {/* Ambient background glows */}
            <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-brand-violet/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-brand-violet/5 blur-[100px] pointer-events-none" />

            <div className="text-center space-y-2 mb-10 relative z-10">
              <span className="text-xs uppercase font-mono tracking-widest text-brand-violet font-bold">
                Membership Plans
              </span>
              <h2 className="text-3xl font-display font-black text-white">
                Choose Your Learning Tier
              </h2>
              <p className="text-sm text-brand-slate max-w-md mx-auto">
                Unlock specialized debugging sandbox tasks, recruiter portals, and verified certificates.
              </p>
            </div>

            {/* Plans List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  glow={plan.isPopular}
                  className={`bg-brand-card/75 border p-6 flex flex-col justify-between relative overflow-hidden ${
                    plan.isPopular
                      ? 'border-brand-violet/50 shadow-lg shadow-brand-violet/5 scale-102 z-10'
                      : 'border-brand-border'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute top-3 right-3 text-[8px] bg-brand-violet text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                      Best Choice
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-display font-bold text-lg text-white">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-brand-slate mt-1 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-baseline space-x-1 py-2">
                      <span className="text-4xl font-display font-black text-white">
                        {plan.price}
                      </span>
                      <span className="text-xs text-brand-slate">
                        /{plan.billing}
                      </span>
                    </div>

                    <div className="border-t border-brand-border/45 pt-4 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="text-xs text-brand-violet mt-0.5">✓</span>
                          <span className="text-xs text-brand-slate leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-brand-border/30">
                    <Button
                      variant={plan.isPopular ? 'primary' : 'outline'}
                      onClick={() => onSelectPlan(plan.id)}
                      fullWidth
                      className={plan.isPopular ? 'font-bold' : ''}
                    >
                      {plan.id === 'free-tier-plan-id' ? 'Stay on Free' : 'Upgrade Now'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
