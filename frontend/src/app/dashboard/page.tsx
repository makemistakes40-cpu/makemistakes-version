'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Navbar } from '../../components/layout/navbar';
import { Footer } from '../../components/layout/footer';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Upgrade Payment modules
import { PricingModal } from './pricing-modal';
import { PaymentWizard } from './payment-wizard';
import { AdminPaymentQueue } from './admin-payment-queue';

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: 'active' | 'completed' | 'locked';
}

interface RoadmapPersonalization {
  recommendedLanguage: string;
  codingChallenges: string;
  projects: string;
  aptitudeFocus: string;
  interviewPrep: string;
  companyPrep: string;
  aiMentor: string;
}

interface Roadmap {
  skills: string;
  goals: string;
  experience: string;
  languages: string;
  dreamCompany: string;
  careerGoalText?: string;
  timeAvailable: string;
  steps: RoadmapStep[];
  personalization?: RoadmapPersonalization;
}

const CAREER_GOALS = [
  { id: 'Join an MNC', label: '🏢 Join an MNC', requiresInput: true, inputLabel: 'Dream Company', placeholder: 'Example: Google, Microsoft, Amazon' },
  { id: 'Join a Startup', label: '🚀 Join a Startup', requiresInput: true, inputLabel: 'Preferred Startup Domain', placeholder: 'Example: AI, FinTech, SaaS' },
  { id: 'Build My Own Startup', label: '💡 Build My Own Startup', requiresInput: false },
  { id: 'Open to Any Good Opportunity', label: '✨ Open to Any Good Opportunity', requiresInput: false },
  { id: 'Other', label: '📝 Other', requiresInput: true, inputLabel: 'Please specify', placeholder: 'Enter your career goal here...', required: true },
];

const LEADERBOARD_PEERS = [
  { rank: 1, name: 'Alice Smith', xp: '1,450 XP', avatar: '💻', isPro: true },
  { rank: 2, name: 'Sarah Jenkins', xp: '1,120 XP', avatar: '🚀', isPro: true },
  { rank: 3, name: 'Vince Carter', xp: '950 XP', avatar: '🔥', isPro: false },
  { rank: 4, name: 'You', xp: '720 XP', avatar: '🎓', isPro: false, isUser: true },
  { rank: 5, name: 'Bob Vance', xp: '680 XP', avatar: '⚙️', isPro: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, isLoading } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(true);

  // AI Questionnaire Chat Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [skills, setSkills] = useState('');
  const [careerGoal, setCareerGoal] = useState('Join an MNC');
  const [careerGoalText, setCareerGoalText] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [languages, setLanguages] = useState('TypeScript');
  const [timeAvailable, setTimeAvailable] = useState('3 hours / week');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Payment Gating and Admin View States
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAdminViewActive, setIsAdminViewActive] = useState(false);

  const fetchRoadmap = async () => {
    try {
      const response = await api.get<{ status: string; roadmap: Roadmap }>('/roadmap');
      if (response.status === 'success' && response.roadmap) {
        setRoadmap(response.roadmap);
      }
    } catch (err) {
      console.error('Fetch roadmap error:', err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.subscriptionTier === 'PRO' && !user.hasCompletedProOnboarding) {
        router.push('/onboarding');
        return;
      }
      fetchRoadmap();
    }
  }, [user]);

  const handleGenerateRoadmap = async () => {
    if (!skills.trim()) {
      alert('Please fill out all questionnaire details.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 600);

    try {
      const response = await api.post<{ status: string; roadmap: Roadmap }>('/roadmap', {
        skills,
        goals: careerGoal,
        experience,
        languages,
        dreamCompany: careerGoalText || '',
        careerGoalText,
        timeAvailable,
      });

      clearInterval(interval);
      setGenerationProgress(100);

      setTimeout(() => {
        if (response.status === 'success' && response.roadmap) {
          setRoadmap(response.roadmap);
        }
        setIsGenerating(false);
      }, 800);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      alert('Failed to generate roadmap. Please check your network and try again.');
    }
  };

  const handlePaymentSuccess = async () => {
    // Refresh user context profile details to load upgraded PRO values
    if (setUser && user) {
      setUser({
        ...user,
        subscriptionTier: 'PRO',
      });
    }
    await fetchRoadmap();
  };

  const isFreeTier = user?.subscriptionTier === 'FREE';
  const isAdminUser = user?.role === 'ADMIN';

  if (isLoading || isRoadmapLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-brand-violet" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-brand-slate text-sm font-display">Syncing layout workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-grow relative z-10">
        
        {/* Free Mode Upgrade Prompt Warning Banner */}
        {isFreeTier && !isAdminViewActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-brand-violet/10 border border-brand-violet/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚡</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  Free Mode Active
                </h4>
                <p className="text-[11px] text-brand-slate">
                  Upgrade to Pro to unlock advanced debugging sandbox tasks and Stage 2, 3, and 4 roadmap lessons.
                </p>
              </div>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsPricingModalOpen(true)} className="text-[10px] py-1.5 px-4 font-bold tracking-wider uppercase">
              Upgrade to Pro
            </Button>
          </motion.div>
        )}

        {/* Profile Banner */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/45 pb-8">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              {isAdminViewActive ? 'Admin Portal' : 'Student Dashboard'}
            </h1>
            <p className="text-sm text-brand-slate font-sans">
              {isAdminViewActive 
                ? 'Manage active manual payment verifications queue.' 
                : 'Explore custom milestones tailored dynamically to your profile.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Admin Switcher Toggle Button */}
            {isAdminUser && (
              <Button
                variant="secondary"
                onClick={() => setIsAdminViewActive((prev) => !prev)}
                className="text-[10px] font-bold uppercase tracking-wider px-4 py-2"
              >
                {isAdminViewActive ? 'Switch to Dashboard' : 'Switch to Admin Queue'}
              </Button>
            )}

            {user && (
              <div className="flex items-center space-x-3 bg-brand-card px-4 py-3 rounded-2xl border border-brand-border">
                <div className="h-10 w-10 rounded-full bg-brand-violet/25 flex items-center justify-center font-display font-bold text-brand-violet border border-brand-violet/30">
                  {user.firstName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-display font-semibold text-white">
                      {user.firstName} {user.lastName}
                    </h4>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isFreeTier ? 'bg-brand-border text-brand-slate' : 'bg-brand-violet text-white'
                    }`}>
                      {user.subscriptionTier}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-brand-slate tracking-widest">
                    {user.role} Account
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {isAdminViewActive ? (
            /* ADMIN PAYMENT QUEUE audit viewport */
            <motion.div
              key="admin-queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminPaymentQueue />
            </motion.div>
          ) : !roadmap ? (
            /* CONVERSATIONAL AI ONBOARDING WIZARD */
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <Card glow className="bg-brand-card/85 p-8 border border-brand-border relative overflow-hidden">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-brand-border">
                  <div className="h-8 w-8 bg-brand-violet/20 border border-brand-violet/30 text-brand-violet rounded-full flex items-center justify-center font-bold">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">AI Roadmap Assistant</h3>
                    <p className="text-[10px] text-brand-slate">Let's compile your customized engineering track</p>
                  </div>
                </div>

                {isGenerating ? (
                  /* Loading synthesis state */
                  <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                    <svg className="animate-spin h-12 w-12 text-brand-violet" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <div className="space-y-2">
                      <h4 className="text-white font-display font-bold text-lg">AI is architecting your roadmap...</h4>
                      <p className="text-xs text-brand-slate max-w-sm">
                        Combining goals with your preferred stack to build dedicated debugging assignments.
                      </p>
                    </div>
                    <div className="w-full max-w-xs bg-brand-border rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="bg-brand-violet h-1.5"
                        initial={{ width: '0%' }}
                        animate={{ width: `${generationProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Conversational questions */
                  <div className="space-y-6 min-h-[220px] flex flex-col justify-between">
                    <div>
                      {wizardStep === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs font-display text-white leading-relaxed bg-brand-violet/5 p-3.5 rounded-xl border border-brand-violet/10">
                            "First, tell me about your **Current Skills**? Mention technologies, frameworks, or languages you already feel comfortable with."
                          </p>
                          <Input
                            placeholder="e.g. basic HTML/CSS, python syntax"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-4">
                          <p className="text-xs font-display text-white leading-relaxed bg-brand-violet/5 p-3.5 rounded-xl border border-brand-violet/10 mb-4">
                            "What is your dream **Career Goal**? We'll personalize your learning roadmap, coding challenges, projects, interview preparation, and skill recommendations."
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-[220px] overflow-y-auto pr-1">
                            {CAREER_GOALS.map((goal) => {
                              const isSelected = careerGoal === goal.id;
                              return (
                                <button
                                  key={goal.id}
                                  type="button"
                                  onClick={() => {
                                    setCareerGoal(goal.id);
                                    setCareerGoalText('');
                                  }}
                                  className={`p-3 rounded-xl border text-left text-xs transition-all relative ${
                                    isSelected
                                      ? 'border-brand-violet bg-brand-violet/10 text-white font-bold'
                                      : 'border-brand-border bg-brand-card text-brand-slate hover:border-brand-border/60 hover:bg-brand-card/80'
                                  }`}
                                >
                                  {goal.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Inline Dynamic Sub-Input */}
                          {(() => {
                            const currentGoalObj = CAREER_GOALS.find(g => g.id === careerGoal);
                            if (currentGoalObj?.requiresInput) {
                              return (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-1 mt-3"
                                >
                                  <label className="text-[9px] uppercase font-mono tracking-widest text-brand-slate font-bold block">
                                    {currentGoalObj.inputLabel} {currentGoalObj.required && <span className="text-red-500">*</span>}
                                  </label>
                                  <Input
                                    placeholder={currentGoalObj.placeholder}
                                    value={careerGoalText}
                                    onChange={(e) => setCareerGoalText(e.target.value)}
                                    className="w-full text-xs py-2 px-3 h-9"
                                    required={currentGoalObj.required}
                                  />
                                </motion.div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-4">
                          <p className="text-xs font-display text-white leading-relaxed bg-brand-violet/5 p-3.5 rounded-xl border border-brand-violet/10">
                            "Understood. How would you describe your current **Coding Experience**?"
                          </p>
                          <select
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand-violet"
                          >
                            <option value="Beginner">Beginner (0-1 years)</option>
                            <option value="Intermediate">Intermediate (1-3 years)</option>
                            <option value="Advanced">Advanced (3+ years)</option>
                          </select>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-4">
                          <p className="text-xs font-display text-white leading-relaxed bg-brand-violet/5 p-3.5 rounded-xl border border-brand-violet/10">
                            "What is your **Preferred Language** for learning and solving coding problems?"
                          </p>
                          <select
                            value={languages}
                            onChange={(e) => setLanguages(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand-violet"
                          >
                            <option>TypeScript</option>
                            <option>JavaScript</option>
                            <option>Python</option>
                            <option>Java</option>
                            <option>C++</option>
                            <option>Go</option>
                            <option>Rust</option>
                          </select>
                        </div>
                      )}

                      {wizardStep === 5 && (
                        <div className="space-y-4">
                          <p className="text-xs font-display text-white leading-relaxed bg-brand-violet/5 p-3.5 rounded-xl border border-brand-violet/10">
                            "Almost done! How much **Time is available** weekly for exercises?"
                          </p>
                          <select
                            value={timeAvailable}
                            onChange={(e) => setTimeAvailable(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand-violet"
                          >
                            <option value="3 hours / week">3 hours / week</option>
                            <option value="5 hours / week">5 hours / week</option>
                            <option value="10 hours / week">10 hours / week</option>
                            <option value="15+ hours / week">15+ hours / week</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-brand-border/45 mt-8">
                      <Button
                        variant="secondary"
                        onClick={() => setWizardStep(prev => prev - 1)}
                        disabled={wizardStep === 1}
                      >
                        Back
                      </Button>
                      <span className="text-[10px] text-brand-slate uppercase font-mono tracking-widest">
                        Question {wizardStep} of 5
                      </span>
                      {wizardStep < 5 ? (
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (wizardStep === 1 && !skills.trim()) { alert('Please enter your skills.'); return; }
                            if (wizardStep === 2) {
                              const currentGoalObj = CAREER_GOALS.find(g => g.id === careerGoal);
                              if (currentGoalObj?.required && !careerGoalText.trim()) {
                                alert('Please specify your career goal.');
                                return;
                              }
                            }
                            setWizardStep(prev => prev + 1);
                          }}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={handleGenerateRoadmap}>
                          Generate AI Roadmap
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ) : (
            /* RENDER ROADMAP TIMELINE & SIDEBAR LEADERBOARD VIEW */
            <motion.div
              key="dashboard-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              
              {/* Personalized roadmap timeline milestones */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-xl font-display font-bold tracking-tight text-white flex items-center space-x-2">
                    <span>🎯 Your AI Learning Path</span>
                  </h3>
                  <span className="text-[10px] text-brand-violet font-sans uppercase tracking-widest font-semibold">
                    Target: {roadmap.dreamCompany} stack
                  </span>
                </div>
                
                <div className="relative border-l border-brand-border pl-6 ml-3 space-y-8">
                  {roadmap.steps.map((milestone) => {
                    // Lock milestones 2, 3, and 4 in FREE mode
                    const isStepLocked = isFreeTier && milestone.id > 1;

                    return (
                      <div key={milestone.id} className="relative">
                        {/* Status Indicator Marker */}
                        <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                          isStepLocked ? 'bg-brand-bg border-brand-border text-brand-slate' :
                          milestone.status === 'completed' ? 'bg-brand-emerald border-brand-emerald' :
                          milestone.status === 'active' ? 'bg-brand-bg border-brand-violet' :
                          'bg-brand-bg border-brand-border'
                        }`} />
                        
                        <div className={`space-y-1 transition-all duration-300 ${isStepLocked ? 'opacity-40' : ''}`}>
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] uppercase font-mono text-brand-slate/60 tracking-wider">
                              {milestone.duration}
                            </span>
                            {isStepLocked && (
                              <span className="text-[9px] bg-brand-violet/20 border border-brand-violet/30 text-brand-violet px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
                                🔒 Pro Only
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-sans font-semibold text-white flex items-center">
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-brand-slate leading-relaxed font-sans">
                            {isStepLocked
                              ? 'This stage is locked on your Free Account. Upgrade to unlock specialized lessons, diagnostic mistake sandboxes, and capstone recruiter projects.'
                              : milestone.description}
                          </p>
                          
                          {isStepLocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsPricingModalOpen(true)}
                              className="mt-2 text-[10px] py-1 px-3"
                            >
                              Unlock Node
                            </Button>
                          ) : (
                            milestone.status === 'active' && (
                              <Button size="sm" className="mt-2 text-[10px] py-1 px-3">
                                Start Module
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-brand-border/45">
                  <Button variant="outline" size="sm" onClick={() => setRoadmap(null)} className="w-1/3">
                    🔄 Re-Generate
                  </Button>
                </div>
              </div>

              {/* Sidebar: Global Competitive Leaderboard & AI Personalization */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* AI Career Toolkit & Personalization details */}
                {roadmap.personalization && (
                  <Card glow className="bg-brand-card/85 p-6 border border-brand-border space-y-4">
                    <div className="flex items-center space-x-2.5 border-b border-brand-border/40 pb-3">
                      <span className="text-xl">🎯</span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                          AI Career Toolkit
                        </h4>
                        <p className="text-[9px] text-brand-slate uppercase font-mono tracking-wider">
                          Goal: {roadmap.goals}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-violet font-bold block">
                          AI Mentor Persona
                        </span>
                        <p className="text-xs text-white font-semibold">
                          {roadmap.personalization.aiMentor}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-emerald font-bold block">
                          Recommended Language
                        </span>
                        <p className="text-xs text-brand-slate leading-relaxed">
                          {roadmap.personalization.recommendedLanguage}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-violet font-bold block">
                          Coding Challenges
                        </span>
                        <p className="text-xs text-brand-slate leading-relaxed">
                          {roadmap.personalization.codingChallenges}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-emerald font-bold block">
                          Target Project
                        </span>
                        <p className="text-xs text-brand-slate leading-relaxed">
                          {roadmap.personalization.projects}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-violet font-bold block">
                          Aptitude Focus
                        </span>
                        <p className="text-xs text-brand-slate leading-relaxed">
                          {roadmap.personalization.aptitudeFocus}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-brand-emerald font-bold block">
                          Interview Preparation
                        </span>
                        <p className="text-xs text-brand-slate leading-relaxed">
                          {roadmap.personalization.interviewPrep}
                        </p>
                      </div>

                      {roadmap.careerGoalText && (
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-mono tracking-widest text-brand-violet font-bold block">
                            Company/Domain Prep
                          </span>
                          <p className="text-xs text-brand-slate leading-relaxed">
                            {roadmap.personalization.companyPrep}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <div className="flex flex-col space-y-1">
                  <h3 className="text-lg font-display font-bold tracking-tight text-white flex items-center">
                    <span>🏆 Global Leaderboard</span>
                  </h3>
                  <span className="text-[10px] text-brand-slate font-sans">Compete with global peers solving mistakes</span>
                </div>

                <Card glow className="bg-brand-card/75 p-6 border border-brand-border">
                  <div className="space-y-4">
                    {LEADERBOARD_PEERS.map((peer) => (
                      <div
                        key={peer.rank}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                          peer.isUser
                            ? 'bg-brand-violet/10 border-brand-violet/30'
                            : 'bg-brand-card/40 border-brand-border/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-mono font-bold w-4 text-center ${
                            peer.rank === 1 ? 'text-yellow-400' :
                            peer.rank === 2 ? 'text-slate-300' :
                            peer.rank === 3 ? 'text-amber-600' :
                            'text-brand-slate'
                          }`}>
                            #{peer.rank}
                          </span>
                          <span className="text-base">{peer.avatar}</span>
                          <div>
                            <span className="text-xs font-display font-semibold text-white block">
                              {peer.name} {peer.isUser && '(You)'}
                            </span>
                            {peer.isPro && (
                              <span className="text-[8px] uppercase tracking-wider font-mono text-brand-violet bg-brand-violet/10 px-1 py-0.5 rounded">
                                PRO
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-brand-slate">
                          {peer.xp}
                        </span>
                      </div>
                    ))}

                    {isFreeTier && (
                      <div className="pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsPricingModalOpen(true)}
                          fullWidth
                          className="text-[10px] uppercase font-bold tracking-widest"
                        >
                          ⚡ Gain 3x XP with Pro
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Pricing comparison overlay */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSelectPlan={(planId) => {
          setIsPricingModalOpen(false);
          if (planId !== 'free-tier-plan-id') {
            setSelectedPlanId(planId);
          }
        }}
      />

      {/* Payment checkout wizard flow */}
      <AnimatePresence>
        {selectedPlanId && (
          <PaymentWizard
            planId={selectedPlanId}
            onClose={() => setSelectedPlanId(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
