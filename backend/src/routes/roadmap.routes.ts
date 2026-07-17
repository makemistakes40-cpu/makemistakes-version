import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Mount protected actions
router.get('/', authenticate, roadmapController.get);
router.post('/', authenticate, roadmapController.generate);

export default router;
