'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Navbar } from '../../../components/layout/navbar';
import { Footer } from '../../../components/layout/footer';
import { api } from '../../../lib/api';

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  xpReward: number;
  estimatedTime: string;
  skills: string[];
  status: string;
  currentStep: string;
}

interface FeedbackLog {
  type: string;
  message: string;
}

export default function MissionPage() {
  const router = useRouter();
  const { id } = useParams();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  // Active step inside UI workflow: 'BRIEF' | 'CONCEPT' | 'EXAMPLES' | 'QUIZ' | 'PLAYGROUND' | 'COMPLETE'
  const [activeStep, setActiveStep] = useState<string>('BRIEF');

  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);

  // Coding Playground States
  const [userCode, setUserCode] = useState(`// Complete the authorize middleware below
export const authorize = (requiredRole: string) => {
  return (req: any, res: any, next: any) => {
    // Write authorization logic here
    
    next();
  };
};`);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackLog[]>([]);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        const response = await api.get<{ status: string; mission: Mission }>('/onboarding/mission');
        if (response.status === 'success') {
          setMission(response.mission);
          setActiveStep(response.mission.currentStep);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMission();
  }, [id]);

  const handleUpdateStep = async (nextStep: string) => {
    if (!mission) return;
    try {
      await api.post('/onboarding/mission/update-step', {
        missionId: mission.id,
        step: nextStep,
      });
      setActiveStep(nextStep);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === 2) { // correct index
      setQuizError(false);
      handleUpdateStep('PLAYGROUND');
    } else {
      setQuizError(true);
    }
  };

  const handleCodeSubmit = async () => {
    if (!mission) return;
    setSubmittingCode(true);
    try {
      const response = await api.post<{ status: string; feedback: FeedbackLog[]; xpEarned: number }>(
        '/onboarding/mission/submit-code',
        {
          missionId: mission.id,
          code: userCode,
        }
      );
      if (response.status === 'success') {
        setFeedback(response.feedback);
        setTimeout(() => {
          setSubmittingCode(false);
          setActiveStep('COMPLETE');
        }, 1500);
      }
    } catch (err) {
      setSubmittingCode(false);
      alert('Submission failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <svg className="animate-spin h-8 w-8 text-brand-violet" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white">
        <div className="text-center space-y-4">
          <p>No active missions found for this account.</p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: BRIEF */}
          {activeStep === 'BRIEF' && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl text-left space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-brand-violet bg-brand-violet/10 border border-brand-violet/20 px-3 py-1 rounded-full font-bold">
                    XP Reward: {mission.xpReward} XP
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-sans tracking-widest text-brand-slate font-bold">Active Onboarding Mission</span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white uppercase">{mission.title}</h2>
                  <p className="text-xs text-brand-slate leading-relaxed max-w-2xl font-sans">{mission.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t border-b border-brand-border/45">
                  <div>
                    <span className="text-[8px] uppercase font-mono text-brand-slate block">Difficulty</span>
                    <span className="text-xs font-bold text-brand-emerald">{mission.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-mono text-brand-slate block">Estimated Time</span>
                    <span className="text-xs font-bold text-white">{mission.estimatedTime}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] uppercase font-mono text-brand-slate block">Required Skills</span>
                    <span className="text-xs font-semibold text-brand-violet">{mission.skills.join(', ')}</span>
                  </div>
                </div>

                <Button variant="primary" fullWidth className="font-bold py-3 mt-4" onClick={() => handleUpdateStep('CONCEPT')}>
                  Start Mission Briefing
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: CONCEPT LEARNING */}
          {activeStep === 'CONCEPT' && (
            <motion.div
              key="concept"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl text-left space-y-6 shadow-2xl">
                <h3 className="text-lg font-display font-bold tracking-tight text-white uppercase">Concept: Role-Based Gates</h3>
                
                <div className="space-y-4 text-xs text-brand-slate leading-relaxed">
                  <p>
                    Role-Based Access Control (RBAC) represents a foundation for securing SaaS architectures. Instead of defining access logic manually per API route, endpoints require a generic middleware check mapping authentication tokens context to specific roles.
                  </p>
                  <blockquote className="border-l-2 border-brand-violet pl-4 font-mono text-[11px] bg-brand-violet/5 py-3 rounded-r-2xl pr-4">
                    "Authentications prove who the user is. Authorizations declare what capabilities they possess."
                  </blockquote>
                  <p>
                    In Node/Express, authorization layers intercept request cycles (`req.user`) and check permissions prior to allowing controllers execution:
                  </p>
                </div>

                <Button variant="primary" fullWidth className="font-bold py-3" onClick={() => handleUpdateStep('EXAMPLES')}>
                  Review Practical Examples
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: INTERACTIVE EXAMPLES */}
          {activeStep === 'EXAMPLES' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl text-left space-y-6 shadow-2xl">
                <h3 className="text-lg font-display font-bold tracking-tight text-white uppercase">Best Practices Sandbox</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-left space-y-2">
                    <span className="text-[9px] font-mono uppercase text-red-400 font-bold">❌ Anti-Pattern (Hardcoded Scopes)</span>
                    <pre className="font-mono text-[10px] text-brand-slate leading-relaxed">
{`app.post('/api/admin/users', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403);
  // Manual check repeated on 20 routes
});`}
                    </pre>
                  </div>

                  <div className="p-4 bg-brand-emerald/5 border border-brand-emerald/10 rounded-2xl text-left space-y-2">
                    <span className="text-[9px] font-mono uppercase text-brand-emerald font-bold">✔️ Production-Ready (Reusable Gates)</span>
                    <pre className="font-mono text-[10px] text-brand-slate leading-relaxed">
{`// Mount middleware gating routing scopes
app.post('/api/admin/users', authorize('MANAGE_USERS'), controller);`}
                    </pre>
                  </div>
                </div>

                <Button variant="primary" fullWidth className="font-bold py-3" onClick={() => handleUpdateStep('QUIZ')}>
                  Take DNA Check Quiz
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: CONCEPT QUIZ */}
          {activeStep === 'QUIZ' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl text-left space-y-6 shadow-2xl">
                <h3 className="text-lg font-display font-bold tracking-tight text-white uppercase">DNA Security Check</h3>
                
                <p className="text-xs text-brand-slate leading-relaxed">
                  Which HTTP status code should be returned if a signed-in student attempts to access a protected administration workspace endpoint?
                </p>

                <div className="space-y-3">
                  {[
                    '401 Unauthorized',
                    '404 Not Found',
                    '403 Forbidden',
                    '500 Server Error'
                  ].map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedAnswer(idx)}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-all font-semibold ${
                          isSelected ? 'bg-brand-violet text-white' : 'bg-brand-border text-brand-slate hover:bg-brand-border/60'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {quizError && (
                  <span className="text-[10px] text-red-400 font-mono block">
                    ⚠️ Incorrect. Hint: The student is authenticated but lacks required authorization scopes.
                  </span>
                )}

                <Button variant="primary" fullWidth className="font-bold py-3 mt-4" onClick={handleQuizSubmit}>
                  Verify Answer
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 5: CODING PLAYGROUND */}
          {activeStep === 'PLAYGROUND' && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-3xl"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl text-left space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-display font-bold tracking-tight text-white uppercase">Mission Sandbox Playground</h3>
                  <span className="text-[10px] font-sans text-brand-slate">Required: export authorize middleware</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Editor mockup */}
                  <div className="md:col-span-2 space-y-2">
                    <textarea
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      className="w-full min-h-[250px] p-4 bg-brand-bg border border-brand-border rounded-2xl text-xs font-mono text-foreground focus:outline-none focus:border-brand-violet leading-relaxed"
                    />
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleCodeSubmit}
                      isLoading={submittingCode}
                      className="font-bold py-3"
                    >
                      Submit Code to AI Mentor
                    </Button>
                  </div>

                  {/* Sidebar checks */}
                  <div className="md:col-span-1 p-4 bg-brand-card border border-brand-border rounded-2xl space-y-4">
                    <h4 className="text-[9px] uppercase font-mono tracking-widest text-brand-slate font-bold">AI Diagnostics Logs</h4>
                    
                    {feedback.length === 0 ? (
                      <div className="text-[10px] text-brand-slate/50 font-mono py-8 text-center leading-relaxed">
                        Waiting for sandbox code verification...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedback.map((log, idx) => (
                          <div key={idx} className="text-[10px] font-mono leading-relaxed space-y-0.5">
                            <span className={`font-bold block ${
                              log.type === 'SUCCESS' ? 'text-brand-emerald' : log.type === 'TIP' ? 'text-brand-violet' : 'text-brand-slate'
                            }`}>
                              [{log.type}]
                            </span>
                            <p className="text-brand-slate">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 6: COMPLETE SUCCESS SCREEN */}
          {activeStep === 'COMPLETE' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <Card className="bg-brand-card/90 border border-brand-border p-8 rounded-3xl relative z-10 shadow-2xl space-y-6">
                <span className="text-4xl animate-bounce block">🏆</span>
                <h3 className="text-2xl font-display font-bold tracking-tight text-white uppercase">Mission Accomplished!</h3>
                
                <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl inline-block px-8">
                  <span className="text-2xl font-display font-black text-brand-emerald">+{mission.xpReward} XP</span>
                  <span className="text-[9px] uppercase font-mono text-brand-slate block mt-1">Awarded to Profile</span>
                </div>

                <p className="text-xs text-brand-slate max-w-sm mx-auto leading-relaxed">
                  First mission checked. Your AI Learning Path timeline is now fully active inside your dashboard profile.
                </p>

                <Button variant="primary" fullWidth className="font-bold py-3 mt-4" onClick={() => router.push('/dashboard')}>
                  Go to Academy Home
                </Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
