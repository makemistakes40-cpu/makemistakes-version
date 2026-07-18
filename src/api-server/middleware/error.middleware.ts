import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack = err.stack;

  // Log using Winston
  logger.error(`${req.method} ${req.originalUrl} - Status: ${statusCode} - Msg: ${message}`, { stack });

  // Save error to database asynchronously to avoid blocking the response
  prisma.errorLog.create({
    data: {
      message,
      stack: stack || null,
      code: err.code ? String(err.code) : null,
      path: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id || null,
      ipAddress: req.ip || null,
    },
  }).catch((dbErr) => {
    // Suppress secondary DB logging failures but write to winston
    logger.warn('Failed to save error log to database:', dbErr);
  });

  // Response mapping
  res.status(statusCode).json({
    status: err.status || 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack }),
  });
};
