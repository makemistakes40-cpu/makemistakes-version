'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CODE_STEPS = [
  {
    title: '1. The Mistake (Uncaught Null Exception)',
    code: `function getUserDashboard(userId: string) {
  const user = fetchUser(userId); // returns User | null
  
  // 🔴 CRASH: Object is possibly null!
  const name = user.firstName.toUpperCase();
  
  return { name, path: "/home" };
}`,
    status: 'error',
    feedback: '💡 AI Diagnostic: You are directly referencing "user.firstName". If fetchUser returns null, this will crash with "TypeError: Cannot read properties of null". Let\'s add a guard or optional chaining.',
  },
  {
    title: '2. Applying AI Guidance',
    code: `function getUserDashboard(userId: string) {
  const user = fetchUser(userId); // returns User | null
  
  // 🟡 RESOLVING: Safe Optional Chaining
  const name = user?.firstName?.toUpperCase() ?? "GUEST";
  
  return { name, path: "/home" };
}`,
    status: 'fixing',
    feedback: '⚙️ Analyzing: Checking for potential type mismatches. Optional chaining added. Default value fallback "GUEST" resolved. Checking builds...',
  },
  {
    title: '3. Corrected & Verified',
    code: `function getUserDashboard(userId: string) {
  const user = fetchUser(userId); // returns User | null
  
  // 🟢 COMPILED: Safe and production-ready!
  const name = user?.firstName?.toUpperCase() ?? "GUEST";
  
  return { name, path: "/home" };
}`,
    status: 'success',
    feedback: '✅ Compile Success: Code compiled without errors. Safety checks passed. Added 1 mistake solved to user profile.',
  },
];

export function AnimatedCodePanel() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % CODE_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = CODE_STEPS[step];

  return (
    <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden shadow-2xl">
      
      {/* Editor Header Bar */}
      <div className="bg-brand-card px-4 py-3 border-b border-brand-border flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs font-mono text-brand-slate">user_profile.ts — TypeScript</span>
        <div className="w-12" />
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[300px]">
        
        {/* Code Content */}
        <div className="col-span-2 p-6 font-mono text-sm bg-[#0a0c16] overflow-x-auto border-r border-brand-border flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.pre
              key={step}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-brand-slate"
            >
              {current.code.split('\n').map((line, idx) => {
                let colorClass = 'text-slate-300';
                if (line.includes('🔴')) colorClass = 'text-red-400 bg-red-950/20 px-1 border-l-2 border-red-500 font-bold';
                else if (line.includes('🟡')) colorClass = 'text-yellow-400 bg-yellow-950/20 px-1 border-l-2 border-yellow-500 font-bold';
                else if (line.includes('🟢')) colorClass = 'text-emerald-400 bg-emerald-950/20 px-1 border-l-2 border-emerald-500 font-bold';
                else if (line.startsWith('function') || line.startsWith('  const') || line.startsWith('  return')) {
                  colorClass = 'text-violet-400';
                }
                return (
                  <div key={idx} className={`py-1 ${colorClass}`}>
                    <span className="text-slate-600 inline-block w-6 text-right mr-4 select-none">{idx + 1}</span>
                    {line}
                  </div>
                );
              })}
            </motion.pre>
          </AnimatePresence>

          {/* Stepper Dots */}
          <div className="flex space-x-2 mt-6 pt-4 border-t border-brand-border/45">
            {CODE_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === idx ? 'w-6 bg-brand-violet' : 'w-2 bg-brand-border'
                }`}
                aria-label={`Code animation step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* AI Diagnostics Box */}
        <div className="col-span-1 p-6 bg-[#0c0e1b]/80 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                current.status === 'error' ? 'bg-red-500' :
                current.status === 'fixing' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <h4 className="text-xs uppercase font-display font-semibold tracking-wider text-brand-slate">
                Diagnostics Panel
              </h4>
            </div>

            <h3 className="font-display font-bold text-base text-white">
              {current.title}
            </h3>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className={`text-xs leading-relaxed p-3.5 rounded-xl border ${
                  current.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                  current.status === 'fixing' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}
              >
                {current.feedback}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-brand-border/45 text-center">
            <button
              onClick={() => setStep((step + 1) % CODE_STEPS.length)}
              className="text-xs font-display font-medium text-brand-violet hover:text-white transition-colors"
            >
              Trigger Next Stage →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
export default AnimatedCodePanel;
