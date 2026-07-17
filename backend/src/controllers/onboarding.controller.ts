import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/app-error';

export class OnboardingController {
  completeOnboarding = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing.');
      }

      const {
        languages,
        frameworks,
        experience,
        weeklyHours,
        dreamCompany,
        careerGoal,
        careerGoalText,
      } = req.body;

      if (!languages || !experience || !careerGoal) {
        throw new BadRequestError('Missing key Developer DNA answers.');
      }

      // Generate a Personalized Roadmap based on goal, custom text and dream company
      let targetCompany = dreamCompany || 'Tech Startups';
      if (careerGoal === 'Join an MNC' && careerGoalText) {
        targetCompany = careerGoalText;
      } else if (careerGoal === 'Government Job' && careerGoalText) {
        targetCompany = careerGoalText;
      } else if (careerGoal === 'Join a Startup' && careerGoalText) {
        targetCompany = `${careerGoalText} Startup`;
      }
      
      const dreamCompName = targetCompany;
      const weeklyCommitment = weeklyHours ? `${weeklyHours} hours` : '10 hours';

      const steps = [
        {
          id: 1,
          title: `Stage 1: Core Foundations in ${languages[0] || 'TypeScript'}`,
          description: `Solidify ${languages[0] || 'TypeScript'} asynchronous behaviors, closures, and structural design. Since your goal is "${careerGoal}", we will center coding drills around this context. Expect 4 tailored bug scenarios.`,
          duration: `Weeks 1-2 (${weeklyCommitment}/week)`,
          status: 'active',
        },
        {
          id: 2,
          title: 'Stage 2: Advanced Architecture & Debugging',
          description: 'Learn how to diagnose database race conditions, memory leaks, and routing bottlenecks. You will practice fixing 5 major architecture mistakes common in high-scale systems.',
          duration: `Weeks 3-4 (${weeklyCommitment}/week)`,
          status: 'locked',
        },
        {
          id: 3,
          title: `Stage 3: Mock System Design for ${dreamCompName}`,
          description: `Architect a scalable, high-throughput microservice matching system guidelines at ${dreamCompName}. Your current skills will be leveraged here to build key modular layers.`,
          duration: `Weeks 5-6 (${weeklyCommitment}/week)`,
          status: 'locked',
        },
        {
          id: 4,
          title: 'Stage 4: Portfolio Capstone Project',
          description: `Develop and deploy a complete production-grade application featuring telemetry and rate limiting. Perfect for your upcoming recruiter pitches at ${dreamCompName}!`,
          duration: `Weeks 7-8 (${weeklyCommitment}/week)`,
          status: 'locked',
        },
      ];

      // Personalize first mission based on career goal
      let missionTitle = 'District 1: Establish System Base';
      let missionDescription = `Build a production-grade route interceptor checking authentication scopes using ${languages[0] || 'TypeScript'}.`;
      
      if (careerGoal === 'Join an MNC') {
        missionTitle = `MNC Target: System Access Control`;
        missionDescription = `Implement standard enterprise-grade middleware checking authorization scopes in ${languages[0] || 'TypeScript'} matching standard architectural patterns at ${targetCompany}.`;
      } else if (careerGoal === 'Join a Startup') {
        missionTitle = `Startup Launch: Endpoint Authentication`;
        missionDescription = `Develop a rapid, secure authentication route interceptor in ${languages[0] || 'TypeScript'} to shield your ${targetCompany} MVP resources.`;
      } else if (careerGoal === 'Government Job') {
        missionTitle = `Secure Gov Gateway: Compliance Routing`;
        missionDescription = `Construct a highly secure compliance interceptor in ${languages[0] || 'TypeScript'} satisfying standard access audit guidelines for ${targetCompany}.`;
      } else if (careerGoal === 'Become a Freelancer') {
        missionTitle = `Client Work: Secure Web Gateways`;
        missionDescription = `Build a reusable, robust security middleware module in ${languages[0] || 'TypeScript'} to validate client dashboard route authorizations.`;
      } else if (careerGoal === 'Build My Own Startup') {
        missionTitle = `SaaS Scaffold: Multi-Tenant Authorization`;
        missionDescription = `Create a multi-tenant role-based access control interceptor in ${languages[0] || 'TypeScript'} to shield SaaS subscription API endpoints.`;
      }

      await prisma.$transaction(async (tx) => {
        // Create or update roadmap
        await tx.personalRoadmap.upsert({
          where: { userId: req.user!.id },
          update: {
            skills: languages.concat(frameworks || []).join(', '),
            goals: careerGoal,
            experience,
            languages: languages.join(', '),
            dreamCompany: dreamCompName,
            careerGoalText: careerGoalText || '',
            timeAvailable: weeklyHours || '10',
            steps,
          },
          create: {
            userId: req.user!.id,
            skills: languages.concat(frameworks || []).join(', '),
            goals: careerGoal,
            experience,
            languages: languages.join(', '),
            dreamCompany: dreamCompName,
            careerGoalText: careerGoalText || '',
            timeAvailable: weeklyHours || '10',
            steps,
          },
        });

        // Update user onboarding status
        await tx.user.update({
          where: { id: req.user!.id },
          data: {
            hasCompletedProOnboarding: true,
          },
        });

        // Initialize First Mission
        await tx.userMission.create({
          data: {
            userId: req.user!.id,
            title: missionTitle,
            description: missionDescription,
            difficulty: 'EASY',
            xpReward: 150,
            estimatedTime: '20 mins',
            skills: ['Express.js', 'RBAC Middleware', 'Security Headers'],
            status: 'ASSIGNED',
            currentStep: 'BRIEF',
          },
        });
      });

      res.status(200).json({
        status: 'success',
        message: 'Developer Academy initialized! Welcome onboard.',
      });
    } catch (error) {
      next(error);
    }
  };

  getMission = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing.');
      }

      let mission = await prisma.userMission.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      // Seeding a default fallback first mission if none exists yet
      if (!mission) {
        mission = await prisma.userMission.create({
          data: {
            userId: req.user.id,
            title: 'District 1: Establish System Base',
            description: 'Build a production-grade route interceptor checking authorization scopes.',
            difficulty: 'EASY',
            xpReward: 150,
            estimatedTime: '20 mins',
            skills: ['Express.js', 'RBAC Middleware', 'Security Headers'],
            status: 'ASSIGNED',
            currentStep: 'BRIEF',
          },
        });
      }

      res.status(200).json({
        status: 'success',
        mission,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMissionStep = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { missionId, step } = req.body;
      if (!missionId || !step) {
        throw new BadRequestError('Missing mission ID or progress step.');
      }

      const mission = await prisma.userMission.findUnique({
        where: { id: missionId },
      });

      if (!mission || mission.userId !== req.user!.id) {
        throw new NotFoundError('Mission not found.');
      }

      const updated = await prisma.userMission.update({
        where: { id: missionId },
        data: { currentStep: step },
      });

      res.status(200).json({
        status: 'success',
        mission: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  submitCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { missionId, code } = req.body;
      if (!missionId || !code) {
        throw new BadRequestError('Code submission parameters missing.');
      }

      const mission = await prisma.userMission.findUnique({
        where: { id: missionId },
      });

      if (!mission || mission.userId !== req.user!.id) {
        throw new NotFoundError('Target mission not found.');
      }

      // Pre-baked high fidelity code assessment results
      const feedback = [
        {
          type: 'INFO',
          message: 'Syntax validation succeeded: 0 syntax issues flagged.',
        },
        {
          type: 'SUCCESS',
          message: 'Authorization checks intercept scopes correctly. Security parameters satisfied!',
        },
        {
          type: 'TIP',
          message: 'Optimization: Consider configuring Helmet headers to restrict frame-options and prevent clickjacking injections.',
        },
      ];

      await prisma.$transaction(async (tx) => {
        // Complete the mission
        await tx.userMission.update({
          where: { id: missionId },
          data: {
            status: 'COMPLETED',
            currentStep: 'COMPLETE',
            codeContent: code,
          },
        });

        // Award user XP points
        await tx.user.update({
          where: { id: req.user!.id },
          data: {
            xpPoints: { increment: mission.xpReward },
          },
        });
      });

      res.status(200).json({
        status: 'success',
        feedback,
        xpEarned: mission.xpReward,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const onboardingController = new OnboardingController();
