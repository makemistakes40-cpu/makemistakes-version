import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { BadRequestError } from '../utils/app-error';

export class WaitlistController {
  joinWaitlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        throw new BadRequestError('Name and email address are required.');
      }

      // Basic email regex verification
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Please provide a valid email address.');
      }

      // Check for duplicate registration
      const existingRegistration = await prisma.waitlist.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingRegistration) {
        throw new BadRequestError('This email is already registered on our early access waitlist.');
      }

      // Store in waitlist table
      const registration = await prisma.waitlist.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
        },
      });

      // Write to audit log
      await prisma.auditLog.create({
        data: {
          action: 'WAITLIST_SIGNUP',
          details: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            registrationId: registration.id,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Successfully registered for early invitation access!',
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const waitlistController = new WaitlistController();
export default waitlistController;
