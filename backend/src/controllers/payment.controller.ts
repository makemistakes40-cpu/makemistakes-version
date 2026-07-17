import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';

export class PaymentController {
  createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { planId } = req.body;
      if (!planId) {
        res.status(400).json({ status: 'fail', message: 'planId is required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const order = await paymentService.createOrder(req.user.id, planId);
      res.status(201).json({
        status: 'success',
        order,
      });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId, utrNumber, screenshotUrl } = req.body;
      if (!paymentId || !utrNumber) {
        res.status(400).json({ status: 'fail', message: 'paymentId and utrNumber are required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const payment = await paymentService.submitPayment(req.user.id, paymentId, utrNumber, screenshotUrl);
      res.status(200).json({
        status: 'success',
        payment,
      });
    } catch (error) {
      next(error);
    }
  };

  status = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ status: 'fail', message: 'Payment ID is required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const payment = await paymentService.getPaymentStatus(req.user.id, id);
      res.status(200).json({
        status: 'success',
        payment,
      });
    } catch (error) {
      next(error);
    }
  };

  timeline = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ status: 'fail', message: 'Payment ID is required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const timeline = await paymentService.getPaymentTimeline(req.user.id, id);
      res.status(200).json({
        status: 'success',
        timeline,
      });
    } catch (error) {
      next(error);
    }
  };

  currentSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const subscription = await paymentService.getCurrentSubscription(req.user.id);
      res.status(200).json({
        status: 'success',
        subscription,
      });
    } catch (error) {
      next(error);
    }
  };

  getInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ status: 'fail', message: 'Invoice ID is required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      // Check if it's invoice ID or payment order ID
      let invoice;
      if (id.startsWith('INV-')) {
        // Find by invoiceNumber
        const record = await paymentService.getInvoiceDetails(req.user.id, id);
        invoice = record;
      } else {
        // Check if there is an invoice with this paymentId or invoiceId
        try {
          invoice = await paymentService.getInvoiceDetails(req.user.id, id);
        } catch {
          invoice = await paymentService.getInvoiceByPayment(req.user.id, id);
        }
      }

      res.status(200).json({
        status: 'success',
        invoice,
      });
    } catch (error) {
      next(error);
    }
  };

  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      const notifications = await paymentService.getUserNotifications(req.user.id);
      res.status(200).json({
        status: 'success',
        notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  readNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ status: 'fail', message: 'Notification ID is required.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        return;
      }

      await paymentService.markNotificationAsRead(req.user.id, id);
      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
