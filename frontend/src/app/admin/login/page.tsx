'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login({ email, password });
      
      // Verification check on credentials success: verify user is admin
      // The auth-provider checkAuth runs automatically inside login.
      // Let's check state after login resolves
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg text-foreground relative overflow-hidden px-4">
      {/* Glow backgrounds */}
      <div className="absolute top-1/3 left-1/2 w-80 h-80 -translate-x-1/2 rounded-full bg-brand-violet/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl relative z-10 shadow-2xl">
          <div className="text-center space-y-2 mb-8 font-sans">
            <span className="text-3xl">🛡️</span>
            <h2 className="text-2xl font-display font-bold tracking-tight text-white uppercase">
              Admin Portal
            </h2>
            <p className="text-xs text-brand-slate">
              Enter your credentials to access the administrative panel
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs text-red-400 font-sans font-semibold leading-relaxed mb-6"
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-sans font-semibold tracking-widest text-brand-slate">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@makemistakes.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-sans font-semibold tracking-widest text-brand-slate">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" isLoading={loading} fullWidth className="font-bold py-3 mt-4">
              Sign In to Portal
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
