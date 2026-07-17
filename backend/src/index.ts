import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './config/logger';

const server = app.listen(env.PORT, async () => {
  try {
    // Verify database connection on startup
    await prisma.$connect();
    logger.info('🚀 Database connected successfully.');
    logger.info(`✨ Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
  } catch (error) {
    logger.error('Failed to start server due to database connection error:', error);
    process.exit(1);
  }
});

// Handle graceful shutdowns
const gracefulShutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Shutting down application gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force shutdown if graceful process takes too long
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
