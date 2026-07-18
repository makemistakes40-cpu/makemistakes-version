import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class AuditService {
  async log(data: {
    userId?: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          details: data.details || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
      logger.info(`AuditLog: Action="${data.action}" | User="${data.userId || 'Guest'}"`);
    } catch (error) {
      logger.error('Failed to write audit log:', error);
    }
  }
}
export const auditService = new AuditService();
