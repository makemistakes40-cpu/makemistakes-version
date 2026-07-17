import { prisma } from '../config/database';

export interface RoadmapInput {
  skills: string;
  goals: string;
  experience: string;
  languages: string;
  dreamCompany: string;
  careerGoalText?: string;
  timeAvailable: string;
}

export class RoadmapService {
  computePersonalization(goals: string, careerGoalText?: string) {
    const text = careerGoalText || '';
    switch (goals) {
      case 'Join an MNC':
        return {
          recommendedLanguage: 'Java, C++, or Python (Heavy DSA & system standards focus)',
          codingChallenges: 'Data structures & algorithms, dynamic programming, and high-scale concurrency edge cases.',
          projects: `Enterprise Distributed Caching service, High-Throughput Message Broker queue, or system design components matching standard pillars.`,
          aptitudeFocus: 'Quantitative analysis, Permutations & Combinations, Probability, and logical reasoning puzzles.',
          interviewPrep: 'Big-O time complexity analysis, FAANG/MNC mock interview sheets, and advanced system design blueprints.',
          companyPrep: text ? `Targeted mock questions and engineering pillars specific to ${text}.` : 'General MNC software engineering assessment guidelines.',
          aiMentor: 'MNC Technical Lead (Focus: Scale, Standards, & DSA)'
        };
      case 'Join a Startup':
        return {
          recommendedLanguage: 'TypeScript, JavaScript, or Python (Rapid prototyping & fullstack capability)',
          codingChallenges: 'Rapid MVP feature implementation, real-time WebSockets integration, and full-stack debugging drills.',
          projects: text ? `Collaborative SaaS whiteboard application, real-time analytics dashboard, or tools tailored to the ${text} domain.` : 'Collaborative SaaS app, real-time analytics engine, or AI-driven developer tool.',
          aptitudeFocus: 'Product-sense logic, rapid estimation math, and fast analytical debugging.',
          interviewPrep: 'Practical live-coding debugging sessions, portfolio review walkthroughs, and system architecture pitch.',
          companyPrep: text ? `SaaS product design patterns and rapid iteration challenges in the ${text} domain.` : 'Startup product design and fullstack performance optimizations.',
          aiMentor: 'Startup CTO (Focus: Speed, Traction, & Pragmatism)'
        };
      case 'Government Job':
        return {
          recommendedLanguage: 'Java, C, or C++ (Stability, legacy systems, and maximum security compliance)',
          codingChallenges: 'Algorithmic safety validation, secure public sector data storage parsing, and memory limitation constraints.',
          projects: text ? `Secure portal database query service, national audit log ledger, or information portal matching ${text} requirements.` : 'Secure citizen database queries, audited system access logs, or national portal systems.',
          aptitudeFocus: 'Logical deduction, verbal ability, and systematic calculation drills under public exam guidelines.',
          interviewPrep: 'Public service technical exam review, structural system diagrams, and descriptive answers formatting.',
          companyPrep: text ? `Specific technical exam syllabus and security compliance guidelines for ${text}.` : 'Government standards, data privacy laws, and database safety protocols.',
          aiMentor: 'System Architect Specialist (Focus: Security, Auditing, & Compliance)'
        };
      case 'Higher Studies':
        return {
          recommendedLanguage: 'Python, R, or Julia (Research, statistical analysis, and machine learning models)',
          codingChallenges: 'Write mathematical simulation scripts, parser AST builders, and data cleanup algorithms.',
          projects: 'Scientific Research Data ingestion pipeline, neural network math matrix multiplier, or custom compiler parser.',
          aptitudeFocus: 'Advanced mathematical proofs, probability distributions, and linear algebra foundations.',
          interviewPrep: 'Research statement formulation, academic presentation reviews, and thesis defense logic.',
          companyPrep: text ? `Domain-specific literature review preparation and research methodologies matching ${text}.` : 'Scientific report writing, latex formatting, and citation parsing.',
          aiMentor: 'Research Professor AI (Focus: Mathematical Rigor & Academic Writing)'
        };
      case 'Become a Freelancer':
        return {
          recommendedLanguage: 'JavaScript, TypeScript, or Python (High market demand for fullstack and integrations)',
          codingChallenges: 'Integrate external client payment APIs, diagnose layout responsive design bugs, and optimize page speeds.',
          projects: 'Custom e-commerce cart dashboard, headless CMS blog API, or subscription invoicing portal for clients.',
          aptitudeFocus: 'Project scope estimation arithmetic, client contract negotiation logic, and cost-benefit pricing models.',
          interviewPrep: 'Freelance proposal writing templates, portfolio presentation guides, and client communication simulations.',
          companyPrep: 'Freelancing platform profile building, bidding optimization, and scope-of-work drafting.',
          aiMentor: 'Senior Contractor AI (Focus: Scope Control & Client Deliverables)'
        };
      case 'Build My Own Startup':
        return {
          recommendedLanguage: 'TypeScript, Python, or Go (Scalable web services, database ORMs, and API simplicity)',
          codingChallenges: 'Multi-tenant database schema queries, subscription billing logic, and custom rate limiters.',
          projects: 'Multi-tenant SaaS analytics suite, automated subscription-billing API, or user auth wizard flow.',
          aptitudeFocus: 'SaaS unit economics, customer lifetime value vs acquisition cost formulas, and cash flow projections.',
          interviewPrep: 'Pitch deck architecture, explaining complex technical trade-offs to investors, and engineering roadmap planning.',
          companyPrep: 'Building MVPs under time pressure, product analytics integration, and scalability checklists.',
          aiMentor: 'Startup Founder AI (Focus: MVP Design & Fast Product Cycles)'
        };
      case 'Work Remotely':
        return {
          recommendedLanguage: 'TypeScript, Go, or Rust (Modern backend systems, microservices, and network utilities)',
          codingChallenges: 'Robust asynchronous workers, remote database connections, and secure auth tokens.',
          projects: 'Geographically distributed key-value store, offline-first collaborative task board, or server log collector.',
          aptitudeFocus: 'Asynchronous collaboration logic, time-zone scheduling math, and analytical self-management.',
          interviewPrep: 'Take-home remote technical assignments, async design docs writing, and video-based system coding.',
          companyPrep: 'Remote-first collaboration tools workflow, git rebase practices, and documentation standards.',
          aiMentor: 'Remote Tech Lead (Focus: Asynchronous Work & Telemetry)'
        };
      case 'Open to Any Good Opportunity':
      default:
        return {
          recommendedLanguage: 'TypeScript or Python (Versatile, high demand, and ideal for interviews)',
          codingChallenges: 'Broad full-stack exercises, RESTful API design, and SQL query optimization.',
          projects: 'Full-stack dashboard application, secure authentication gateway API, or scheduling service.',
          aptitudeFocus: 'General cognitive aptitude, core logical reasoning, and basic quantitative problems.',
          interviewPrep: 'Standard system design patterns, resume builder checklist, and behavioral mock interviews.',
          companyPrep: text ? `Guidelines matching engineering standards for ${text}.` : 'General coding interview preparation.',
          aiMentor: 'General Engineering Coach (Focus: Software Engineering Fundamentals)'
        };
    }
  }

  async getRoadmap(userId: string) {
    const roadmap = await prisma.personalRoadmap.findUnique({
      where: { userId },
    });
    if (!roadmap) return null;

    const personalization = this.computePersonalization(roadmap.goals, roadmap.careerGoalText);

    return {
      ...roadmap,
      personalization,
    };
  }

  async generateRoadmap(userId: string, input: RoadmapInput) {
    const { skills, goals, experience, languages, dreamCompany, careerGoalText, timeAvailable } = input;

    // Dynamically compile personalized steps based on their inputs
    const targetLanguage = languages.trim() || 'TypeScript';
    let targetCompany = dreamCompany.trim() || 'Tech Startups';
    if (goals === 'Join an MNC' && careerGoalText) {
      targetCompany = careerGoalText;
    } else if (goals === 'Government Job' && careerGoalText) {
      targetCompany = careerGoalText;
    } else if (goals === 'Join a Startup' && careerGoalText) {
      targetCompany = `${careerGoalText} Startup`;
    }
    const weeklyCommitment = timeAvailable.trim() || '10 hours';

    const steps = [
      {
        id: 1,
        title: `Stage 1: Core Foundations in ${targetLanguage}`,
        description: `Solidify ${targetLanguage} asynchronous behaviors, closures, and structural design. Since your goal is "${goals}", we will center coding drills around this context. Expect 4 tailored bug scenarios.`,
        duration: `Weeks 1-2 (${weeklyCommitment}/week)`,
        status: 'active',
      },
      {
        id: 2,
        title: `Stage 2: Advanced Architecture & Debugging`,
        description: `Learn how to diagnose database race conditions, memory leaks, and routing bottlenecks. You will practice fixing 5 major architecture mistakes common in high-scale systems.`,
        duration: `Weeks 3-4 (${weeklyCommitment}/week)`,
        status: 'locked',
      },
      {
        id: 3,
        title: `Stage 3: Mock System Design for ${targetCompany}`,
        description: `Architect a scalable, high-throughput microservice matching system guidelines at ${targetCompany}. Your current skills in "${skills}" will be leveraged here to build key modular layers.`,
        duration: `Weeks 5-6 (${weeklyCommitment}/week)`,
        status: 'locked',
      },
      {
        id: 4,
        title: `Stage 4: Portfolio Capstone Project`,
        description: `Develop and deploy a complete production-grade application featuring telemetry and rate limiting. Perfect for your upcoming recruiter pitches at ${targetCompany}!`,
        duration: `Weeks 7-8 (${weeklyCommitment}/week)`,
        status: 'locked',
      },
    ];

    // Transactionally write / update roadmap in DB
    const roadmap = await prisma.personalRoadmap.upsert({
      where: { userId },
      update: {
        skills,
        goals,
        experience,
        languages,
        dreamCompany,
        careerGoalText: careerGoalText || '',
        timeAvailable,
        steps,
      },
      create: {
        userId,
        skills,
        goals,
        experience,
        languages,
        dreamCompany,
        careerGoalText: careerGoalText || '',
        timeAvailable,
        steps,
      },
    });

    const personalization = this.computePersonalization(roadmap.goals, roadmap.careerGoalText);

    return {
      ...roadmap,
      personalization,
    };
  }
}

export const roadmapService = new RoadmapService();
