import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validator.middleware';
import { signupSchema, loginSchema } from '../utils/validation-schemas';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

// Public auth routes with rate limiting
router.post('/register', authLimiter, validate(signupSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);

// Protected auth routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
