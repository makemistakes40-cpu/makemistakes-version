'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { api, ApiError } from '../../lib/api';

export function JoinAccessSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/waitlist', { name, email });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">

      <Card className="bg-brand-card/45 border border-brand-border py-14 px-8 md:px-16 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 max-w-xl w-full flex flex-col items-center"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-sans tracking-wider font-bold text-brand-emerald uppercase">
                  <span>🚀 Limited Release</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white">
                  Join Early Access Waitlist
                </h2>
                <p className="text-sm text-brand-slate leading-relaxed font-sans">
                  Apply today to secure your invitation to the private alpha. Get first-hand access to compiler mistake diagnostics, personalized developer maps, and recruiter matching features.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl w-full text-left font-medium">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="pt-2 w-full flex justify-center">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={loading}
                    className="w-full sm:w-auto min-w-[200px]"
                  >
                    Request Invitation
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-6 max-w-md w-full py-6 flex flex-col items-center"
            >
              <div className="h-16 w-16 bg-brand-emerald/15 border border-brand-emerald/30 text-brand-emerald rounded-full flex items-center justify-center text-3xl">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-sans font-bold tracking-tight text-white">
                  Invitation Request Confirmed!
                </h3>
                <p className="text-sm text-brand-slate leading-relaxed font-sans">
                  Thank you, <strong className="text-white">{name}</strong>. We've added <span className="text-brand-violet font-semibold">{email}</span> to our developer onboarding list. You will receive an access token as spots open up.
                </p>
              </div>
              <div className="p-4 bg-brand-violet/5 border border-brand-violet/10 rounded-[16px] w-full text-xs text-brand-slate font-mono uppercase tracking-wider space-y-1.5">
                <div className="flex justify-between">
                  <span>Registration Spot:</span>
                  <span className="text-white font-bold">#MM-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-brand-emerald font-bold">Queueing Alpha</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccess(false);
                  setName('');
                  setEmail('');
                }}
              >
                Register Another Email
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </section>
  );
}

export default JoinAccessSection;
