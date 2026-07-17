import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import { ForbiddenError } from '../utils/app-error';
import { Role } from '@prisma/client';

export class AdminPaymentController {
  private verifyAdminRole(user?: { role: Role }) {
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenError('Access denied. Admin privileges required.');
    }
  }

  getQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.verifyAdminRole(req.user);
      
      const queue = await paymentService.getAdminQueue();
      res.status(200).json({
        status: 'success',
        queue,
      });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.verifyAdminRole(req.user);

      const { paymentId } = req.body;
      if (!paymentId) {
        res.status(400).json({ status: 'fail', message: 'paymentId is required for approval.' });
        return;
      }

      await paymentService.approvePayment(req.user!.id, paymentId);
      
      res.status(200).json({
        status: 'success',
        message: 'Payment verified and subscription activated successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.verifyAdminRole(req.user);

      const { paymentId, reason } = req.body;
      if (!paymentId || !reason) {
        res.status(400).json({ status: 'fail', message: 'paymentId and reason are required for rejection.' });
        return;
      }

      await paymentService.rejectPayment(req.user!.id, paymentId, reason);

      res.status(200).json({
        status: 'success',
        message: 'Payment audit rejected successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminPaymentController = new AdminPaymentController();
