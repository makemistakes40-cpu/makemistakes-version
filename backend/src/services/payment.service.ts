import { prisma } from '../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/app-error';
import { PaymentStatus } from '@prisma/client';

export class PaymentService {
  async createOrder(userId: string, planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Subscription plan not found.');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          amount: plan.price,
          gst: plan.gst,
          total: plan.total,
          status: PaymentStatus.PENDING,
          expiresAt,
        },
      });

      // Create initial timeline entry
      await tx.paymentTimeline.create({
        data: {
          paymentId: payment.id,
          status: 'PENDING',
          title: 'Order Generated',
          description: 'Your upgrade order has been initiated. Proceed to scan QR and make payment.',
        },
      });

      return payment;
    });
  }

  async submitPayment(userId: string, paymentId: string, utrNumber: string, screenshotUrl?: string) {
    // 1. Form Validation (format of UTR ID must be exactly 12 digits)
    if (!/^\d{12}$/.test(utrNumber)) {
      throw new BadRequestError('Invalid Transaction/UTR ID format. Must be a 12-digit numeric code.');
    }

    // 2. Check duplicate UTR Number
    const existingVerification = await prisma.paymentVerification.findUnique({
      where: { utrNumber },
    });

    if (existingVerification) {
      throw new ConflictError('A payment with this Transaction ID / UTR Number has already been submitted.');
    }

    // 3. Fetch payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Order record not found.');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized payment submission.');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestError(`Payment cannot be submitted. Current status: ${payment.status}`);
    }

    // Check expiration timer
    if (new Date() > payment.expiresAt) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.EXPIRED },
        });
        await tx.paymentTimeline.create({
          data: {
            paymentId,
            status: 'EXPIRED',
            title: 'Payment Expired',
            description: 'The 15-minute payment session expired before UTR submission.',
          },
        });
      });
      throw new BadRequestError('This order payment session has expired (15-minute limit exceeded).');
    }

    // 4. Transactional update to processing and create verification log
    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.PROCESSING },
      });

      await tx.paymentVerification.create({
        data: {
          paymentId,
          utrNumber,
          screenshotUrl: screenshotUrl || null,
        },
      });

      // Timeline Milestones
      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'SUBMITTED',
          title: 'Payment Submitted',
          description: `UTR Code ${utrNumber} submitted successfully.`,
        },
      });

      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'PROCESSING',
          title: 'Waiting Verification',
          description: 'Our admin team is verifying your transaction in our bank logs. Normally takes 2-5 minutes.',
        },
      });

      return updatedPayment;
    });
  }

  async getPaymentStatus(userId: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { verification: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment order not found.');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized access to payment order.');
    }

    return payment;
  }

  async getPaymentTimeline(userId: string, paymentId: string) {
    // Verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment order not found.');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized access to payment timeline.');
    }

    return prisma.paymentTimeline.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCurrentSubscription(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  // Retrieve admin audit verification queue
  async getAdminQueue() {
    return prisma.payment.findMany({
      where: { status: PaymentStatus.PROCESSING },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        verification: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approvePayment(adminId: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        verification: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment order not found.');
    }

    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new BadRequestError(`Only PROCESSING payments can be verified. Current: ${payment.status}`);
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    return prisma.$transaction(async (tx) => {
      // 1. Update payment status to verified
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.VERIFIED },
      });

      // 2. Log reviewer ID on verification record
      await tx.paymentVerification.update({
        where: { paymentId },
        data: { reviewerId: adminId },
      });

      // 3. Upsert user active subscription
      await tx.subscription.upsert({
        where: { userId: payment.userId },
        update: {
          planId: 'pro-tier-plan-id',
          status: 'ACTIVE',
          startsAt: new Date(),
          expiresAt,
        },
        create: {
          userId: payment.userId,
          planId: 'pro-tier-plan-id',
          status: 'ACTIVE',
          startsAt: new Date(),
          expiresAt,
        },
      });

      // 4. Log Subscription History
      await tx.subscriptionHistory.create({
        data: {
          userId: payment.userId,
          planId: 'pro-tier-plan-id',
          status: 'ACTIVE',
          startsAt: new Date(),
          expiresAt,
          action: 'ACTIVATE',
        },
      });

      // 5. Upgrade user account subscription tier
      await tx.user.update({
        where: { id: payment.userId },
        data: { subscriptionTier: 'PRO' },
      });

      // 6. Generate Invoice
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.invoice.create({
        data: {
          invoiceNumber,
          paymentId,
          userId: payment.userId,
          planName: 'Pro Member Plan',
          amount: payment.amount,
          gst: payment.gst,
          total: payment.total,
          paymentDate: new Date(),
          expiryDate: expiresAt,
        },
      });

      // 7. Timeline Milestones Update
      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'VERIFIED',
          title: 'Payment Verified',
          description: 'Payment successfully audited and matched in bank logs.',
        },
      });

      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'ACTIVATED',
          title: 'Subscription Activated',
          description: 'Premium access successfully unlocked. Welcome to Pro Academy!',
        },
      });

      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'INVOICE_GENERATED',
          title: 'Invoice Generated',
          description: `Invoice ${invoiceNumber} compiled successfully.`,
        },
      });

      // 8. Create In-App Notification
      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Welcome to MakeMistakes Pro!',
          message: 'Your payment was approved. Unlimited AI Mentoring and Advanced roadmaps are now unlocked.',
          type: 'SUCCESS',
        },
      });

      // 9. Write audit logs
      await tx.auditLog.create({
        data: {
          userId: payment.userId,
          action: 'SUBSCRIPTION_PRO_ACTIVATED',
          details: { paymentId, adminId, invoiceNumber },
        },
      });

      // 10. Simulate secure email sending to Winston console logger
      console.log(`
=========================================
[EMAIL SERVICE - SECURE STACK]
To: ${payment.user.email}
Subject: 🎉 Welcome to MakeMistakes Pro!
Message:
Hi ${payment.user.firstName},

Your payment of $${payment.total.toFixed(2)} (Order ID: ${paymentId}) has been verified.
Your Pro subscription is now ACTIVE until ${expiresAt.toLocaleDateString()}.
You can download your PDF receipt in the app under Invoice: ${invoiceNumber}.

Let's turn some mistakes into learning moments!
- MakeMistakes Team
=========================================
      `);
    });
  }

  async rejectPayment(adminId: string, paymentId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        verification: true,
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment order not found.');
    }

    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new BadRequestError(`Only PROCESSING payments can be audited. Current: ${payment.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Set status to rejected
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REJECTED },
      });

      // 2. Set review reason and reviewer id
      await tx.paymentVerification.update({
        where: { paymentId },
        data: {
          reviewerId: adminId,
          rejectionReason: reason,
        },
      });

      // 3. Timeline Milestones Update
      await tx.paymentTimeline.create({
        data: {
          paymentId,
          status: 'REJECTED',
          title: 'Verification Rejected',
          description: `Rejection reason: ${reason}.`,
        },
      });

      // 4. Create In-App Notification alert
      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: '✕ Payment Verification Rejected',
          message: `We could not verify your payment. Reason: ${reason}. Please double check details.`,
          type: 'ALERT',
        },
      });

      // 5. Write audit log
      await tx.auditLog.create({
        data: {
          userId: payment.userId,
          action: 'SUBSCRIPTION_PRO_REJECTED',
          details: { paymentId, adminId, reason },
        },
      });

      // 6. Simulate email alert to logger
      console.log(`
=========================================
[EMAIL SERVICE - SECURE STACK]
To: ${payment.user.email}
Subject: Action Required: Payment Verification Rejected
Message:
Hi ${payment.user.firstName},

We were unable to verify your premium payment for Order ID: ${paymentId}.
Reviewer notes: "${reason}"

Please check the UTR code and resubmit on the student dashboard.
If you have questions, please reach out to support.

- MakeMistakes Team
=========================================
      `);
    });
  }

  async getInvoiceDetails(userId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    // Check ownership or admin status
    if (invoice.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user?.role !== 'ADMIN') {
        throw new BadRequestError('Unauthorized access to invoice details.');
      }
    }

    return invoice;
  }

  async getInvoiceByPayment(userId: string, paymentId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { paymentId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not generated for this order yet.');
    }

    if (invoice.userId !== userId) {
      throw new BadRequestError('Unauthorized access to invoice.');
    }

    return invoice;
  }

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markNotificationAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}

export const paymentService = new PaymentService();
