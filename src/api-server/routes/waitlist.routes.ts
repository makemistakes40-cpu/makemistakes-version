import { Router } from 'express';
import { waitlistController } from '../controllers/waitlist.controller';

const router = Router();

router.post('/', waitlistController.joinWaitlist);

export default router;
