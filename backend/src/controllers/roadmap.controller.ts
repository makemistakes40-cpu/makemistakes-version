import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { roadmapService } from '../services/roadmap.service';
import { auditService } from '../services/audit.service';

export class RoadmapController {
  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Authentication required' });
        return;
      }
      
      const roadmap = await roadmapService.getRoadmap(req.user.id);
      
      res.status(200).json({
        status: 'success',
        roadmap,
      });
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Authentication required' });
        return;
      }

      const { skills, goals, experience, languages, dreamCompany, careerGoalText, timeAvailable } = req.body;

      if (!skills || !goals || !experience || !languages || !timeAvailable) {
        res.status(400).json({
          status: 'fail',
          message: 'All roadmap options (skills, goals, experience, languages, timeAvailable) are required.',
        });
        return;
      }

      const roadmap = await roadmapService.generateRoadmap(req.user.id, {
        skills,
        goals,
        experience,
        languages,
        dreamCompany,
        careerGoalText: careerGoalText || '',
        timeAvailable,
      });

      await auditService.log({
        userId: req.user.id,
        action: 'AI_ROADMAP_GENERATED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { dreamCompany, preferredLanguage: languages },
      });

      res.status(201).json({
        status: 'success',
        roadmap,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const roadmapController = new RoadmapController();
