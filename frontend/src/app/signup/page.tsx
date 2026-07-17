'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { signupFormSchema } from '../../lib/schemas';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 150 : -150, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 150 : -150, opacity: 0 }),
};

export default function SignupPage() {
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER'>('STUDENT');
  
  // Student Profile State
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [currentYear, setCurrentYear] = useState('1st Year');
  const [programmingLevel, setProgrammingLevel] = useState('Beginner');
  const [interestedCareer, setInterestedCareer] = useState('Full-stack Developer');
  const [preferredLanguage, setPreferredLanguage] = useState('TypeScript');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Validation & Loading States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep = (currentStep: number): boolean => {
    setErrors({});
    setServerError('');
    
    if (currentStep === 1) {
      if (!firstName.trim()) { setErrors(prev => ({ ...prev, firstName: 'First name is required' })); return false; }
      if (!lastName.trim()) { setErrors(prev => ({ ...prev, lastName: 'Last name is required' })); return false; }
      if (!email.trim() || !email.includes('@')) { setErrors(prev => ({ ...prev, email: 'Enter a valid email' })); return false; }
      if (password.length < 6) { setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' })); return false; }
      return true;
    }
    
    if (currentStep === 2 && role === 'STUDENT') {
      if (!college.trim()) { setErrors(prev => ({ ...prev, college: 'College name is required' })); return false; }
      if (!degree.trim()) { setErrors(prev => ({ ...prev, degree: 'Degree is required' })); return false; }
      if (!branch.trim()) { setErrors(prev => ({ ...prev, branch: 'Branch is required' })); return false; }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (role === 'RECRUITER' && step === 1) {
        // Recruiters skip steps 2 & 3
        submitForm();
      } else if (step < 3) {
        setDirection(1);
        setStep(prev => prev + 1);
      } else {
        submitForm();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  };

  const submitForm = async () => {
    setLoading(true);
    setServerError('');

    const payload = {
      email,
      password,
      firstName,
      lastName,
      role,
      ...(role === 'STUDENT' && {
        college,
        degree,
        branch,
        currentYear,
        programmingLevel,
        interestedCareer,
        preferredLanguage,
        githubUrl: githubUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
      }),
    };

    // Client Zod validation
    const validation = signupFormSchema.safeParse(payload);
    if (!validation.success) {
      const formatted = validation.error.format();
      const newErrors: Record<string, string> = {};
      Object.keys(formatted).forEach((key) => {
        const errObj = (formatted as any)[key];
        if (errObj && errObj._errors && errObj._errors[0]) {
          newErrors[key] = errObj._errors[0];
        }
      });
      setErrors(newErrors);
      setLoading(false);
      
      // Send user back to step 1/2 if that's where the error is
      if (newErrors.firstName || newErrors.lastName || newErrors.email || newErrors.password) {
        setStep(1);
      } else if (newErrors.college || newErrors.degree || newErrors.branch) {
        setStep(2);
      }
      return;
    }

    try {
      await signup(payload);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 relative py-12">

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-sans font-bold text-3xl tracking-tight text-white inline-block mb-3">
            Make<span className="text-brand-violet">Mistakes</span>
          </Link>
          <p className="text-sm text-brand-slate font-sans">Create your account and unlock personalized lessons</p>
        </div>

        <Card className="bg-brand-card p-8 border border-brand-border overflow-hidden">
          
          {/* Progress Indicators */}
          {role === 'STUDENT' && (
            <div className="flex items-center justify-between mb-8 border-b border-brand-border pb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center space-x-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s ? 'bg-brand-violet text-white' : 'bg-brand-border text-brand-slate'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-[10px] uppercase font-sans tracking-widest hidden sm:inline ${
                    step === s ? 'text-brand-violet font-semibold' : 'text-brand-slate/50'
                  }`}>
                    {s === 1 ? 'Credentials' : s === 2 ? 'Education' : 'Preferences'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {serverError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[12px] text-xs text-red-400 font-sans font-semibold text-center mb-6">
              {serverError}
            </div>
          )}

          <div className="relative min-h-[340px] flex flex-col justify-between">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-4 w-full"
              >
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        error={errors.firstName}
                        disabled={loading}
                        required
                      />
                      <Input
                        label="Last Name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        error={errors.lastName}
                        disabled={loading}
                        required
                      />
                    </div>

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
                      placeholder="•••••••• (Min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                      disabled={loading}
                      required
                    />

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-sans font-semibold text-brand-slate tracking-wider uppercase">
                        Account Purpose
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole('STUDENT')}
                          className={`py-2.5 px-3 rounded-[12px] border text-xs font-sans font-semibold transition-all duration-300 cursor-pointer ${
                            role === 'STUDENT'
                              ? 'bg-brand-violet/10 border-brand-violet text-white'
                              : 'bg-brand-card border-brand-border text-brand-slate hover:border-brand-violet/30'
                          }`}
                          disabled={loading}
                        >
                          🎓 Student & Learner
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('RECRUITER')}
                          className={`py-2.5 px-3 rounded-[12px] border text-xs font-sans font-semibold transition-all duration-300 cursor-pointer ${
                            role === 'RECRUITER'
                              ? 'bg-brand-violet/10 border-brand-violet text-white'
                              : 'bg-brand-card border-brand-border text-brand-slate hover:border-brand-violet/30'
                          }`}
                          disabled={loading}
                        >
                          💼 Tech Recruiter
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && role === 'STUDENT' && (
                  <>
                    <Input
                      label="College / University"
                      type="text"
                      placeholder="Stanford University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      error={errors.college}
                      disabled={loading}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Degree"
                        type="text"
                        placeholder="B.S. / B.Tech"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        error={errors.degree}
                        disabled={loading}
                        required
                      />
                      <Input
                        label="Branch / Major"
                        type="text"
                        placeholder="Computer Science"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        error={errors.branch}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-sans font-medium text-brand-slate tracking-wider uppercase">
                        Current Year
                      </label>
                      <select
                        value={currentYear}
                        onChange={(e) => setCurrentYear(e.target.value)}
                        className="px-4 py-3 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-sm focus:outline-none focus:border-brand-violet"
                        disabled={loading}
                      >
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>Graduate Study</option>
                      </select>
                    </div>
                  </>
                )}

                {step === 3 && role === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-sans font-medium text-brand-slate tracking-wider uppercase">
                          Programming Level
                        </label>
                        <select
                          value={programmingLevel}
                          onChange={(e) => setProgrammingLevel(e.target.value)}
                          className="px-4 py-3 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-sm focus:outline-none focus:border-brand-violet"
                          disabled={loading}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-sans font-medium text-brand-slate tracking-wider uppercase">
                          Preferred Language
                        </label>
                        <select
                          value={preferredLanguage}
                          onChange={(e) => setPreferredLanguage(e.target.value)}
                          className="px-4 py-3 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-sm focus:outline-none focus:border-brand-violet"
                          disabled={loading}
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
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-sans font-medium text-brand-slate tracking-wider uppercase">
                        Interested Career Path
                      </label>
                      <select
                        value={interestedCareer}
                        onChange={(e) => setInterestedCareer(e.target.value)}
                        className="px-4 py-3 bg-brand-bg-sec border border-brand-border rounded-[12px] text-foreground text-sm focus:outline-none focus:border-brand-violet"
                        disabled={loading}
                      >
                        <option>Full-stack Developer</option>
                        <option>Frontend Developer</option>
                        <option>Backend Developer</option>
                        <option>DevOps Engineer</option>
                        <option>AI / ML Engineer</option>
                        <option>Mobile App Developer</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="GitHub URL (Optional)"
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        error={errors.githubUrl}
                        disabled={loading}
                      />
                      <Input
                        label="LinkedIn URL (Optional)"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        error={errors.linkedinUrl}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Form Actions */}
            <div className="flex items-center space-x-4 mt-8 pt-4 border-t border-brand-border/45">
              {step > 1 && (
                <Button variant="secondary" onClick={handleBack} disabled={loading} className="w-1/3">
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                isLoading={loading}
                className={step > 1 ? 'w-2/3' : 'w-full'}
              >
                {step === (role === 'STUDENT' ? 3 : 1) ? 'Submit Registration' : 'Continue'}
              </Button>
            </div>

          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-brand-slate">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-violet hover:underline font-medium">
                Log In
              </Link>
            </span>
          </div>

        </Card>
      </div>
    </div>
  );
}
