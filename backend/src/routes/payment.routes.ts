import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// Student payment and billing routes
router.post('/payments/submit', authenticate as any, paymentController.submit);
router.post('/payments/create-order', authenticate as any, paymentController.createOrder);
router.get('/payments/status/:id', authenticate as any, paymentController.status);
router.get('/payments/timeline/:id', authenticate as any, paymentController.timeline);
router.get('/subscription/current', authenticate as any, paymentController.currentSubscription);

// Invoices
router.get('/invoice/:id', authenticate as any, paymentController.getInvoice);

// In-app notifications center
router.get('/notifications', authenticate as any, paymentController.getNotifications);
router.post('/notifications/read/:id', authenticate as any, paymentController.readNotification);

export default router;
