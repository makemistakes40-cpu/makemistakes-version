'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '../../../components/layout/navbar';
import { Footer } from '../../../components/layout/footer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { motion } from 'framer-motion';

interface TimelineStep {
  id: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
}

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('id');

  const [paymentStatus, setPaymentStatus] = useState<string>('PROCESSING');
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!paymentId) return;

    try {
      // 1. Fetch current payment details
      const statusRes = await api.get<{ status: string; payment: { status: string; verification?: { rejectionReason?: string } } }>(`/payments/status/${paymentId}`);
      if (statusRes.status === 'success' && statusRes.payment) {
        const status = statusRes.payment.status;
        setPaymentStatus(status);

        if (status === 'VERIFIED') {
          // Success! Redirect to welcome screen
          router.push('/payment/welcome');
          return;
        } else if (status === 'REJECTED') {
          setRejectionReason(statusRes.payment.verification?.rejectionReason || 'Verification rejected by administrator.');
        }
      }

      // 2. Fetch timeline history
      const timelineRes = await api.get<{ status: string; timeline: TimelineStep[] }>(`/payments/timeline/${paymentId}`);
      if (timelineRes.status === 'success' && timelineRes.timeline) {
        setTimeline(timelineRes.timeline);
      }
    } catch (err) {
      console.error('Processing status pull error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll state every 4 seconds
  useEffect(() => {
    if (paymentId) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 4000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  if (!paymentId) {
    return (
      <div className="text-center py-16 space-y-4">
        <span className="text-3xl">⚠️</span>
        <h3 className="text-white font-display font-black text-lg">No Order reference ID found.</h3>
        <p className="text-xs text-brand-slate">Please launch upgrade portal from the dashboard.</p>
        <Button variant="primary" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <svg className="animate-spin h-10 w-10 text-brand-violet" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-brand-slate font-mono">Syncing order milestones...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header status card */}
      <Card glow className="bg-brand-card/90 p-8 border border-brand-border text-center space-y-6 relative overflow-hidden">
        {/* Glow sphere background */}
        <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-violet/10 blur-[80px] pointer-events-none" />

        <div className="space-y-4">
          <div className="flex justify-center">
            {paymentStatus === 'REJECTED' ? (
              <div className="h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 text-2xl font-bold">
                ✕
              </div>
            ) : (
              <div className="relative h-16 w-16">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-violet/20 opacity-75" />
                <div className="relative rounded-full h-16 w-16 bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center text-xl">
                  ⏳
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black text-white">
              {paymentStatus === 'REJECTED' ? 'Verification Failed' : 'Verifying Transaction'}
            </h2>
            <p className="text-xs text-brand-slate max-w-sm mx-auto leading-relaxed">
              {paymentStatus === 'REJECTED'
                ? 'Your transaction claim was rejected by our compliance team. Review notes below.'
                : 'Your payment details have been received and are undergoing bank log audit checks.'}
            </p>
          </div>
        </div>

        {/* Rejection notice box */}
        {paymentStatus === 'REJECTED' && rejectionReason && (
          <div className="p-4 bg-red-500/5 border border-red-500/25 rounded-2xl text-left space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold text-red-400 tracking-widest block">
              Auditor Rejection Reason:
            </span>
            <p className="text-xs text-brand-slate font-display leading-relaxed">
              {rejectionReason}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-brand-border/45 text-left">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-mono text-brand-slate/60 tracking-wider">Status</span>
            <span className={`text-xs font-bold font-mono block ${
              paymentStatus === 'REJECTED' ? 'text-red-500' : 'text-brand-violet'
            }`}>
              {paymentStatus}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-mono text-brand-slate/60 tracking-wider">Estimated Wait</span>
            <span className="text-xs font-bold font-mono text-white block">2-5 minutes</span>
          </div>
        </div>
      </Card>

      {/* Live vertical timeline logs */}
      <div className="space-y-4">
        <h3 className="text-sm font-display font-bold uppercase tracking-widest text-brand-slate">
          Transaction Timeline
        </h3>

        <Card className="bg-brand-card/75 border border-brand-border p-6 space-y-6 relative">
          <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-brand-border/45" />

          {timeline.map((step, idx) => (
            <div key={step.id} className="flex items-start space-x-4 relative z-10">
              {/* Timeline dot */}
              <div className="h-6 w-6 rounded-full border bg-brand-bg flex items-center justify-center text-[10px] font-mono shrink-0 transition-colors duration-300 border-brand-violet text-brand-violet">
                {idx + 1}
              </div>
              <div className="space-y-0.5 flex-grow">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-xs font-display font-bold text-white">
                    {step.title}
                  </h4>
                  <span className="text-[9px] font-mono text-brand-slate/50">
                    {new Date(step.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-brand-slate leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="text-center">
        <Button variant="secondary" onClick={() => router.push('/dashboard')} className="w-1/3 text-xs">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <svg className="animate-spin h-10 w-10 text-brand-violet" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-brand-slate font-mono">Loading processing view...</span>
          </div>
        }>
          <ProcessingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
