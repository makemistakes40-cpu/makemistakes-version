import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { onboardingController } from '../controllers/onboarding.controller';

const router = Router();

router.post('/onboarding/complete', authenticate as any, onboardingController.completeOnboarding);
router.get('/onboarding/mission', authenticate as any, onboardingController.getMission);
router.post('/onboarding/mission/update-step', authenticate as any, onboardingController.updateMissionStep);
router.post('/onboarding/mission/submit-code', authenticate as any, onboardingController.submitCode);

export default router;
