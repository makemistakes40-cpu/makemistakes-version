import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../utils/app-error';
import { prisma } from '../config/database';

export const requirePermission = (permissionName: string) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required.'));
      }

      // Retrieve user's roleId from database
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { roleId: true },
      });

      if (!dbUser || !dbUser.roleId) {
        return next(new ForbiddenError('Access denied. No permissions associated with this account.'));
      }

      // Query if this role possesses the target permission name
      const rolePermission = await prisma.systemRolePermission.findFirst({
        where: {
          roleId: dbUser.roleId,
          permission: {
            name: permissionName,
          },
        },
      });

      if (!rolePermission) {
        return next(new ForbiddenError(`Access denied. Missing permission: ${permissionName}`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
