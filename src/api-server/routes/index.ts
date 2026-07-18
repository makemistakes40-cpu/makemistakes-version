import { Router } from 'express';
import authRoutes from './auth.routes';
import roadmapRoutes from './roadmap.routes';

const router = Router();

// API Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

import paymentRoutes from './payment.routes';
import adminPaymentRoutes from './admin-payment.routes';
import adminRoutes from './admin.routes';
import onboardingRoutes from './onboarding.routes';
import waitlistRoutes from './waitlist.routes';

// Mount routes
router.use('/auth', authRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/', paymentRoutes);
router.use('/', adminPaymentRoutes);
router.use('/', adminRoutes);
router.use('/', onboardingRoutes);

export default router;
