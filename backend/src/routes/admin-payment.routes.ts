import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminPaymentController } from '../controllers/admin-payment.controller';

const router = Router();

// Admin subscription audit and queue actions (supporting both singular/plural paths)
router.get('/admin/payments/queue', authenticate as any, adminPaymentController.getQueue);
router.get('/admin/payment/queue', authenticate as any, adminPaymentController.getQueue);

router.post('/admin/payments/approve', authenticate as any, adminPaymentController.approve);
router.post('/admin/payment/approve', authenticate as any, adminPaymentController.approve);

router.post('/admin/payments/reject', authenticate as any, adminPaymentController.reject);
router.post('/admin/payment/reject', authenticate as any, adminPaymentController.reject);

export default router;
