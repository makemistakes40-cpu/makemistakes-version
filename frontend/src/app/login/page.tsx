'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { loginFormSchema } from '../../lib/schemas';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setLoading(true);

    // Validate using Zod schema
    const validation = loginFormSchema.safeParse({ email, password });
    if (!validation.success) {
      const formatted = validation.error.format();
      setErrors({
        email: formatted.email?._errors[0],
        password: formatted.password?._errors[0],
      });
      setLoading(false);
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      setServerError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 relative">
      <div className="absolute top-1/2 left-1/2 w-[35rem] h-[35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-violet/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-black text-3xl tracking-tight text-white inline-block mb-3">
            Make<span className="text-brand-violet">Mistakes</span>
          </Link>
          <p className="text-sm text-brand-slate">Sign in to your learning dashboard</p>
        </div>

        <Card glow className="bg-brand-card/85 p-8 border border-brand-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {serverError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-display font-medium text-center">
                {serverError}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
              required
            />

            <Button type="submit" variant="primary" fullWidth isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-brand-slate">
              New to MakeMistakes?{' '}
              <Link href="/signup" className="text-brand-violet hover:underline font-medium">
                Create an account
              </Link>
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
