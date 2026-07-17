'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PaymentWizardProps {
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Order {
  id: string;
  amount: number;
  gst: number;
  total: number;
  expiresAt: string;
}

export function PaymentWizard({ planId, onClose, onSuccess }: PaymentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Order Summary, 2: Payment, 3: Processing, 4: Success, 5: Rejected
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  // Form Fields
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Plan Details (Display specs)
  const planInfo = planId === 'pro-tier-plan-id' 
    ? { name: 'Pro Member Subscription', billing: 'Monthly' }
    : { name: 'Enterprise License', billing: 'Monthly' };

  // Timer countdown
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setStep(5);
      setRejectionReason('Payment timeout. The 15-minute verification session expired.');
    }
  }, [timeLeft, step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Create order on mount
  useEffect(() => {
    const createOrder = async () => {
      try {
        setLoading(true);
        const response = await api.post<{ status: string; order: Order }>('/payments/create-order', { planId });
        if (response.status === 'success' && response.order) {
          setOrder(response.order);
        }
      } catch (err) {
        console.error('Order creation error:', err);
        alert('Failed to generate order ID. Please try again.');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    createOrder();
  }, [planId]);

  // Copy UPI ID to clipboard
  const handleCopyUPI = () => {
    navigator.clipboard.writeText('makemistakes@ybl');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Convert uploaded image to base64 data-url
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (limit: 4MB)
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds the 4MB limit.');
        return;
      }
      // Validate file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert('Only PNG or JPEG images are accepted.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Submit payment verification form
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!utrNumber.trim() || utrNumber.length < 12) {
      alert('Please enter a valid 12-digit UPI Transaction/UTR ID.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{ status: string }>('/payments/submit', {
        paymentId: order.id,
        utrNumber,
        screenshotUrl: screenshotBase64,
      });

      if (response.status === 'success') {
        router.push(`/payment/processing?id=${order.id}`);
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Payment submission failed. Check UTR ID duplication.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Poll payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 3 && order) {
      interval = setInterval(async () => {
        try {
          const response = await api.get<{ status: string; payment: { status: string; verification?: { rejectionReason?: string } } }>(`/payments/status/${order.id}`);
          if (response.status === 'success' && response.payment) {
            const currentStatus = response.payment.status;
            if (currentStatus === 'VERIFIED') {
              clearInterval(interval);
              setStep(4); // Success Animation!
            } else if (currentStatus === 'REJECTED') {
              clearInterval(interval);
              setRejectionReason(response.payment.verification?.rejectionReason || 'Transaction review failed.');
              setStep(5); // Show rejected status screen
            }
          }
        } catch (err) {
          console.error('Polling status error:', err);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, order]);

  if (loading && step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <svg className="animate-spin h-8 w-8 text-brand-violet" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-brand-card/95 border border-brand-border p-8 rounded-3xl w-full max-w-md z-10 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-violet/10 blur-[80px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* STEP 1: ORDER SUMMARY */}
          {step === 1 && order && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="font-display font-black text-xl text-white">Order Summary</h3>
                <p className="text-xs text-brand-slate">Review your details before payment</p>
              </div>

              <Card className="bg-brand-card/50 border border-brand-border/40 p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-slate">Plan Name</span>
                  <span className="text-white font-bold">{planInfo.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-slate">Billing Period</span>
                  <span className="text-white font-mono">{planInfo.billing}</span>
                </div>
                <div className="border-t border-brand-border/20 my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-brand-slate">Price</span>
                  <span className="text-white font-mono">${order.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-slate">GST (18%)</span>
                  <span className="text-white font-mono">${order.gst.toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-border/45 my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-white font-semibold">Total Amount</span>
                  <span className="text-brand-violet font-mono font-black">${order.total.toFixed(2)}</span>
                </div>
              </Card>

              <div className="space-y-1.5 text-center">
                <span className="text-[9px] uppercase font-mono text-brand-slate/60 tracking-wider block">
                  Order ID: {order.id}
                </span>
                <span className="text-[9px] font-mono text-brand-violet tracking-wide block">
                  Expires in: 15 minutes
                </span>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button variant="secondary" onClick={onClose} fullWidth>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setStep(2)} fullWidth>
                  Proceed to Pay
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: UPI PAYMENT SCREEN */}
          {step === 2 && order && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="flex justify-between items-center bg-brand-violet/10 border border-brand-violet/25 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-white uppercase font-mono tracking-wider font-bold">UPI QR Payment</span>
                  <span className="text-xs font-mono font-bold text-brand-violet animate-pulse">{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code Graphic layout */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-brand-border/20 shadow-xl relative group">
                {/* Simulated stylized premium QR code */}
                <svg className="w-40 h-40 text-brand-bg" viewBox="0 0 100 100" fill="currentColor">
                  {/* Square corner indicators */}
                  <rect x="5" y="5" width="25" height="25" rx="2" fill="currentColor" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                  <rect x="70" y="5" width="25" height="25" rx="2" fill="currentColor" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                  <rect x="5" y="70" width="25" height="25" rx="2" fill="currentColor" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                  {/* Randomized static bytes structure layout */}
                  <rect x="40" y="10" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="55" y="15" width="6" height="6" rx="1" fill="currentColor" />
                  <rect x="45" y="30" width="10" height="10" rx="1" fill="currentColor" />
                  <rect x="10" y="45" width="8" height="6" rx="1" fill="currentColor" />
                  <rect x="30" y="50" width="14" height="8" rx="1" fill="currentColor" />
                  <rect x="65" y="45" width="12" height="12" rx="1" fill="currentColor" />
                  <rect x="75" y="65" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="45" y="75" width="10" height="10" rx="1" fill="currentColor" />
                  <rect x="35" y="80" width="6" height="8" rx="1" fill="currentColor" />
                  <rect x="60" y="80" width="8" height="6" rx="1" fill="currentColor" />
                </svg>
                <span className="text-[8px] uppercase tracking-wider font-mono text-brand-slate mt-3 font-semibold">
                  Scan to Pay: ${order.total.toFixed(2)} (incl. GST)
                </span>
              </div>

              {/* UPI and Merchant metadata */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs bg-brand-card border border-brand-border/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-brand-slate block">UPI ID</span>
                    <span className="text-white font-mono font-bold">makemistakes@ybl</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleCopyUPI} className="text-[10px] py-1 px-3.5">
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                
                <div className="text-[10px] text-brand-slate space-y-1">
                  <div className="flex justify-between">
                    <span>Merchant Name:</span>
                    <span className="text-white font-semibold">MakeMistakes Learning Platform</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Reference ID:</span>
                    <span className="text-white font-mono">{order.id}</span>
                  </div>
                </div>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 border-t border-brand-border/30">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-brand-slate font-bold">
                    UPI Transaction ID / UTR (12 digits) *
                  </label>
                  <Input
                    placeholder="e.g. 123456789012"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    required
                    className="font-mono text-center tracking-widest text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-brand-slate font-bold">
                    Screenshot Proof (Optional, max 4MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleScreenshotChange}
                    className="w-full text-xs text-brand-slate file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-violet/20 file:text-brand-violet hover:file:bg-brand-violet/30 file:cursor-pointer"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)} fullWidth>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" isLoading={loading} fullWidth>
                    Submit Payment
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: PROCESSING / PENDING REVIEW */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative h-16 w-16">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-violet/30 opacity-75" />
                  <div className="relative rounded-full h-16 w-16 bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
                    ⏳
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-display font-bold text-lg">Under Verification</h4>
                <p className="text-xs text-brand-slate max-w-xs mx-auto leading-relaxed">
                  Your payment verification log has been submitted. Our administrators are auditing the UTR ID matches.
                </p>
              </div>

              <div className="p-3.5 bg-brand-card/80 border border-brand-border/40 rounded-xl space-y-1.5">
                <span className="text-[10px] text-brand-slate uppercase font-mono tracking-widest block">
                  Status: Pending Audit
                </span>
                <span className="text-[9px] text-brand-slate/60 block">
                  Do not close this panel. It updates dynamically once approved.
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={onClose} fullWidth>
                Close (Keep checking in background)
              </Button>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS ANIMATION */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="h-16 w-16 rounded-full bg-brand-emerald/10 border-2 border-brand-emerald flex items-center justify-center text-brand-emerald text-2xl font-bold"
                >
                  ✓
                </motion.div>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-display font-black text-xl">Subscription Activated!</h4>
                <p className="text-xs text-brand-slate max-w-xs mx-auto leading-relaxed">
                  Congratulations! Your transaction has been approved. You are now a **Pro Member** with full platform access.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                fullWidth
              >
                Go to Pro Dashboard
              </Button>
            </motion.div>
          )}

          {/* STEP 5: TIMEOUT OR REJECTED VIEW */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 text-2xl font-bold">
                  ✕
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-display font-bold text-lg">Transaction Rejected</h4>
                <p className="text-xs text-brand-slate max-w-xs mx-auto leading-relaxed">
                  The verification claim was audited and could not be verified by admin.
                </p>
              </div>

              {rejectionReason && (
                <div className="p-4 bg-red-500/5 border border-red-500/25 rounded-2xl text-left">
                  <span className="text-[9px] uppercase font-mono font-bold text-red-400 block tracking-widest mb-1">
                    Auditor Review Reason:
                  </span>
                  <p className="text-xs text-brand-slate font-display leading-relaxed">
                    {rejectionReason}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <Button variant="secondary" onClick={onClose} fullWidth>
                  Dismiss
                </Button>
                <Button variant="primary" onClick={() => setStep(1)} fullWidth>
                  Retry Payment
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
