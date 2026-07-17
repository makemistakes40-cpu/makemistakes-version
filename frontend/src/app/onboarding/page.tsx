'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../lib/api';

const AVAILABLE_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++'];
const AVAILABLE_FRAMEWORKS = ['React', 'Next.js', 'Express', 'FastAPI', 'Django', 'Spring Boot'];

const CAREER_GOALS = [
  { id: 'Join an MNC', label: '🏢 Join an MNC', requiresInput: true, inputLabel: 'Dream Company', placeholder: 'Example: Google, Microsoft, Amazon' },
  { id: 'Join a Startup', label: '🚀 Join a Startup', requiresInput: true, inputLabel: 'Preferred Startup Domain', placeholder: 'Example: AI, FinTech, SaaS' },
  { id: 'Build My Own Startup', label: '💡 Build My Own Startup', requiresInput: false },
  { id: 'Open to Any Good Opportunity', label: '✨ Open to Any Good Opportunity', requiresInput: false },
  { id: 'Other', label: '📝 Other', requiresInput: true, inputLabel: 'Please specify', placeholder: 'Enter your career goal here...', required: true },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Onboarding Step State: 1 to 7
  const [step, setStep] = useState(1);

  // Form selections
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string[]>([]);
  const [careerGoal, setCareerGoal] = useState('Join an MNC');
  const [careerGoalText, setCareerGoalText] = useState('');
  const [experience, setExperience] = useState('Intermediate');
  const [weeklyHours, setWeeklyHours] = useState('3');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [tickerMsg, setTickerMsg] = useState('Analyzing Profile...');

  const handleToggleLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleToggleFrame = (frame: string) => {
    setSelectedFrame((prev) =>
      prev.includes(frame) ? prev.filter((f) => f !== frame) : [...prev, frame]
    );
  };

  // Submit DNA to start processing
  const handleSubmitDNA = async () => {
    if (selectedLangs.length === 0) {
      alert('Please select at least one primary language.');
      return;
    }

    setStep(5);
    setLoading(true);

    const tickers = [
      'Analyzing Developer DNA...',
      'Mapping potential skill gaps...',
      'Structuring Personalized Academy Roadmap...',
      'Initializing Interactive Districts...',
      'Preparing First Coding Mission...',
    ];

    let currentTickIdx = 0;
    const interval = setInterval(() => {
      currentTickIdx++;
      if (currentTickIdx < tickers.length) {
        setTickerMsg(tickers[currentTickIdx]);
      }
    }, 1200);

    try {
      const response = await api.post<{ status: string; message: string }>('/onboarding/complete', {
        languages: selectedLangs,
        frameworks: selectedFrame,
        experience,
        dreamCompany: careerGoalText || '',
        careerGoal,
        careerGoalText,
        weeklyHours,
      });

      if (response.status === 'success') {
        setTimeout(() => {
          clearInterval(interval);
          setLoading(false);
          setStep(6);
        }, 6000);
      }
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      alert('Onboarding failed. Please try again.');
      setStep(4);
    }
  };

  // Fetch created mission details
  const handleAccessAcademy = async () => {
    try {
      const response = await api.get<{ status: string; mission: { id: string } }>('/onboarding/mission');
      if (response.status === 'success') {
        router.push(`/mission/${response.mission.id}`);
      }
    } catch (err) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-foreground flex items-center justify-center p-4 relative overflow-hidden">

      <AnimatePresence mode="wait">
        {/* STEP 1: CINEMATIC WELCOME */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl text-center"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <span className="text-4xl">👑</span>
              <h2 className="text-3xl font-sans font-bold tracking-tight text-white uppercase">
                Welcome to Pro Academy
              </h2>
              <p className="text-xs text-brand-slate max-w-md mx-auto leading-relaxed font-sans">
                You have successfully upgraded your membership. The platform is ready to customize an AI-powered learning workspace designed around your career goals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-left">
                <div className="p-4 bg-brand-violet/5 border border-brand-violet/10 rounded-[12px] flex items-center space-x-3">
                  <span className="text-xl">🗺️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">4 Stages Roadmap</h4>
                    <span className="text-[10px] text-brand-slate">Custom skills & milestones</span>
                  </div>
                </div>
                <div className="p-4 bg-brand-emerald/5 border border-brand-emerald/10 rounded-[12px] flex items-center space-x-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Unlimited AI Sandbox</h4>
                    <span className="text-[10px] text-brand-slate">Real-time compiler advice</span>
                  </div>
                </div>
                <div className="p-4 bg-brand-violet/5 border border-brand-violet/10 rounded-[12px] flex items-center space-x-3">
                  <span className="text-xl">⚔️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Daily Missions</h4>
                    <span className="text-[10px] text-brand-slate">Earn XP and solve bugs</span>
                  </div>
                </div>
                <div className="p-4 bg-brand-emerald/5 border border-brand-emerald/10 rounded-[12px] flex items-center space-x-3">
                  <span className="text-xl">👥</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Recruiter Pipelines</h4>
                    <span className="text-[10px] text-brand-slate">Showcase your portfolio</span>
                  </div>
                </div>
              </div>

              <Button variant="primary" fullWidth className="font-bold py-3 mt-4" onClick={() => setStep(2)}>
                Begin Your Journey
              </Button>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: AI MENTOR INTRODUCTION */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-lg"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-[12px] bg-brand-violet/20 border border-brand-violet flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-sans font-bold text-white text-base uppercase">AI Mentor</h3>
                  <span className="text-[10px] text-brand-emerald font-sans uppercase font-semibold">Online & Analyzing</span>
                </div>
              </div>

              <div className="p-4 rounded-[12px] bg-brand-bg-sec border border-brand-border text-xs text-brand-slate leading-relaxed">
                "Hello student! I am your interactive AI Mentor. I will guide you through our dynamic learning districts, scan your submitted sandbox codes, and flag security warnings. Before we construct your workspace, I need to collect your Developer DNA to customize the journey."
              </div>

              <Button variant="primary" fullWidth className="font-bold py-3 mt-2" onClick={() => setStep(3)}>
                Initialize Assessment
              </Button>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: CAREER GOAL AI ASSESSMENT */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-3xl text-left"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-sans uppercase tracking-widest text-brand-violet font-bold">
                  Step 1 of 2: AI Assessment
                </span>
                <h3 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
                  🎯 What is your dream career goal?
                </h3>
                <p className="text-xs text-brand-slate leading-relaxed font-sans">
                  We'll personalize your learning roadmap, coding challenges, projects, interview preparation, and skill recommendations based on your career goal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {CAREER_GOALS.map((goal) => {
                  const isSelected = careerGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        setCareerGoal(goal.id);
                        setCareerGoalText('');
                      }}
                      className={`p-4 rounded-[12px] border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer ${
                        isSelected
                          ? 'border-brand-violet bg-brand-violet/10 text-white'
                          : 'border-brand-border bg-brand-card text-brand-slate hover:border-brand-border/60 hover:bg-brand-card/85'
                      }`}
                    >
                      <span className="text-xs font-semibold">{goal.label}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-brand-violet text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Conditional Input Fields */}
              {(() => {
                const currentGoalObj = CAREER_GOALS.find(g => g.id === careerGoal);
                if (currentGoalObj?.requiresInput) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-brand-bg-sec border border-brand-border rounded-[12px] space-y-2 mt-4"
                    >
                      <label className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold block">
                        {currentGoalObj.inputLabel} {currentGoalObj.required && <span className="text-red-500">*</span>}
                      </label>
                      <Input
                        placeholder={currentGoalObj.placeholder}
                        value={careerGoalText}
                        onChange={(e) => setCareerGoalText(e.target.value)}
                        className="w-full"
                        required={currentGoalObj.required}
                      />
                    </motion.div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between items-center pt-4 border-t border-brand-border/40 mt-6">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="font-bold py-2.5 px-6"
                  onClick={() => {
                    const currentGoalObj = CAREER_GOALS.find(g => g.id === careerGoal);
                    if (currentGoalObj?.required && !careerGoalText.trim()) {
                      alert('Please specify your career goal.');
                      return;
                    }
                    setStep(4);
                  }}
                >
                  Next: Developer DNA
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: DEVELOPER DNA */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl text-left"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-sans uppercase tracking-widest text-brand-emerald font-bold">
                  Step 2 of 2: AI Assessment
                </span>
                <h3 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
                  🧬 Developer DNA Assessment
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Languages selectors */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold">
                    Primary Languages
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                      const isSelected = selectedLangs.includes(lang);
                      return (
                        <button
                          key={lang}
                          onClick={() => handleToggleLang(lang)}
                          className={`px-3 py-1.5 rounded-[10px] text-xs transition-all font-semibold ${
                            isSelected ? 'bg-brand-violet text-white' : 'bg-brand-border text-brand-slate hover:bg-brand-border/80'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frameworks selector */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold">
                    Preferred Frameworks
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_FRAMEWORKS.map((frame) => {
                      const isSelected = selectedFrame.includes(frame);
                      return (
                        <button
                          key={frame}
                          onClick={() => handleToggleFrame(frame)}
                          className={`px-3 py-1.5 rounded-[10px] text-xs transition-all font-semibold ${
                            isSelected ? 'bg-brand-emerald text-brand-bg' : 'bg-brand-border text-brand-slate hover:bg-brand-border/80'
                          }`}
                        >
                          {frame}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold">
                    Experience Level
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-xs focus:outline-none focus:border-brand-violet"
                  >
                    <option value="Beginner">Beginner (0-1 years)</option>
                    <option value="Intermediate">Intermediate (1-3 years)</option>
                    <option value="Advanced">Advanced (3+ years)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold">
                    Weekly Commitment
                  </label>
                  <select
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-xs focus:outline-none focus:border-brand-violet"
                  >
                    <option value="3">3 hours / week</option>
                    <option value="5">5 hours / week</option>
                    <option value="10">10 hours / week</option>
                    <option value="15+">15+ hours / week</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-between items-center pt-4 border-t border-brand-border/40 mt-6">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button variant="primary" className="font-bold py-2.5 px-6" onClick={handleSubmitDNA}>
                  Analyze Developer DNA
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 5: AI PROCESSING ANIMATION */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md text-center"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <div className="h-16 w-16 mx-auto rounded-full border-2 border-brand-violet border-t-transparent animate-spin" />
              <h3 className="text-lg font-sans font-bold text-white uppercase tracking-tight">
                AI Engines Processing
              </h3>
              <p className="text-xs font-sans text-brand-slate animate-pulse">
                {tickerMsg}
              </p>
            </Card>
          </motion.div>
        )}

        {/* STEP 6: LEARNING ROADMAP PREVIEW */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl text-left"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <h3 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
                🗺️ Tailored Roadmap Generated
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-brand-violet/5 border border-brand-violet/10 rounded-[16px]">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-brand-violet block">Stage 1: Core Foundations</span>
                  <h4 className="font-bold text-white text-sm mt-1">Establish route interceptors checks in {selectedLangs[0] || 'TypeScript'}</h4>
                  <p className="text-xs text-brand-slate mt-1">Configure authorization scopes, schema validations, and database constraints.</p>
                </div>
                <div className="p-4 bg-brand-card border border-brand-border rounded-[16px] opacity-60">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-brand-slate block">Stage 2: High Scale System</span>
                  <h4 className="font-bold text-white text-sm mt-1">Concurrency, Deadlocks, & Caching</h4>
                  <p className="text-xs text-brand-slate mt-1">Design cache policies and optimize relational table triggers.</p>
                </div>
                <div className="p-4 bg-brand-card border border-brand-border rounded-[16px] opacity-60">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-brand-slate block">Stage 3: Advanced Mock System</span>
                  <h4 className="font-bold text-white text-sm mt-1">Architect systems for {careerGoalText || 'Tech Startups'} Guidelines</h4>
                  <p className="text-xs text-brand-slate mt-1">Construct message queues and token buckets algorithms.</p>
                </div>
              </div>

              <Button variant="primary" fullWidth className="font-bold py-3" onClick={() => setStep(7)}>
                Continue
              </Button>
            </Card>
          </motion.div>
        )}

        {/* STEP 7: ACADEMY DISTRICT UNLOCK */}
        {step === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl text-center"
          >
            <Card className="bg-brand-card border border-brand-border p-8 rounded-[20px] relative z-10 shadow-sm space-y-6">
              <span className="text-4xl">🔓</span>
              <h3 className="text-2xl font-sans font-bold text-white uppercase tracking-tight">
                Academy Districts Unlocked
              </h3>

              <div className="space-y-3 py-2 text-left">
                <div className="p-4 border border-brand-emerald bg-brand-emerald/5 rounded-[16px] flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">District 1: Secure Code Sandbox</h4>
                    <span className="text-[10px] text-brand-slate">Active & Available</span>
                  </div>
                  <span className="text-xs font-bold text-brand-emerald">UNLOCKED</span>
                </div>
                <div className="p-4 border border-brand-border bg-brand-card/50 rounded-[16px] opacity-45 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">District 2: High Concurrency Laboratory</h4>
                    <span className="text-[10px] text-brand-slate">Locked Stage 2 Requirement</span>
                  </div>
                  <span className="text-xs font-bold text-brand-slate">LOCKED</span>
                </div>
              </div>

              <Button variant="primary" fullWidth className="font-bold py-3" onClick={handleAccessAcademy}>
                Access Academy
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
