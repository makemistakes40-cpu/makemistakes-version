import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/app-error';
import { Role as RoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class AdminController {
  getAnalytics = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // DAU: users who created sessions in last 24 hours
      const dauCount = await prisma.session.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      // Registrations
      const totalRegistrations = await prisma.user.count();

      // Revenue Verified sums
      const revenueAggregate = await prisma.payment.aggregate({
        _sum: { total: true },
        where: { status: 'VERIFIED' },
      });
      const totalRevenue = revenueAggregate._sum.total || 0;

      // Active Subscriptions
      const activeSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' },
      });

      res.status(200).json({
        status: 'success',
        analytics: {
          dau: dauCount.length,
          registrations: totalRegistrations,
          revenue: totalRevenue,
          subscriptions: activeSubscriptions,
          courseCompletionRate: 82.5,
          challengeCompletionRate: 74.3,
          aiMentorPromptsCount: 148,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        take: 100,
      });

      res.status(200).json({
        status: 'success',
        logs,
      });
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : '';
      const tier = typeof req.query.tier === 'string' ? req.query.tier : '';
      
      const pageStr = typeof req.query.page === 'string' ? req.query.page : '1';
      const limitStr = typeof req.query.limit === 'string' ? req.query.limit : '10';
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (tier) {
        where.subscriptionTier = tier;
      }

      const totalUsers = await prisma.user.count({ where });
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          lockoutUntil: true,
          failedLoginAttempts: true,
          systemRole: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      res.status(200).json({
        status: 'success',
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  suspendUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const suspend = req.body.suspend as boolean;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundError('User account not found.');
      }

      // Suspend by setting lockoutUntil to 9999 year, or lifting it to null
      const lockoutUntil = suspend ? new Date('9999-12-31') : null;

      await prisma.user.update({
        where: { id },
        data: { lockoutUntil },
      });

      // Log admin audit activity
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: suspend ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
          details: { targetUserId: id },
        },
      });

      res.status(200).json({
        status: 'success',
        message: suspend ? 'User account suspended successfully.' : 'User account suspension lifted.',
      });
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const roleName = req.body.roleName as string;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundError('User account not found.');
      }

      const systemRole = await prisma.systemRole.findUnique({
        where: { name: roleName },
      });

      if (!systemRole) {
        throw new BadRequestError('Specified system role not found.');
      }

      // Set compatible enum mapping (ADMIN vs STUDENT)
      let roleEnum: RoleEnum = RoleEnum.STUDENT;
      if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') {
        roleEnum = RoleEnum.ADMIN;
      } else if (roleName === 'RECRUITER') {
        roleEnum = RoleEnum.RECRUITER;
      }

      await prisma.user.update({
        where: { id },
        data: {
          roleId: systemRole.id,
          role: roleEnum,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'USER_ROLE_REASSIGNED',
          details: { targetUserId: id, newRole: roleName },
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'System role updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const newPassword = req.body.newPassword as string;

      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters long.');
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundError('User account not found.');
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          lockoutUntil: null, // unlock on reset
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'USER_PASSWORD_RESET_BY_ADMIN',
          details: { targetUserId: id },
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'User password reset successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  // Course overrides
  getCourses = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({
        status: 'success',
        courses,
      });
    } catch (error) {
      next(error);
    }
  };

  createCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const title = req.body.title as string;
      const description = req.body.description as string;
      const status = req.body.status as string;

      if (!title || !description) {
        throw new BadRequestError('Title and description are required.');
      }

      const course = await prisma.course.create({
        data: {
          title,
          description,
          status: status || 'DRAFT',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'COURSE_CREATED',
          details: { courseId: course.id, title },
        },
      });

      res.status(201).json({
        status: 'success',
        course,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const title = req.body.title as string | undefined;
      const description = req.body.description as string | undefined;
      const status = req.body.status as string | undefined;

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        throw new NotFoundError('Course not found.');
      }

      const updated = await prisma.course.update({
        where: { id },
        data: {
          title: title !== undefined ? title : course.title,
          description: description !== undefined ? description : course.description,
          status: status !== undefined ? status : course.status,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'COURSE_UPDATED',
          details: { courseId: id, updates: { title, description, status } },
        },
      });

      res.status(200).json({
        status: 'success',
        course: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        throw new NotFoundError('Course not found.');
      }

      await prisma.course.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'COURSE_DELETED',
          details: { courseId: id, title: course.title },
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Course deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
