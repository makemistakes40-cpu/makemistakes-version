import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rate-limiter.middleware';
import routes from './routes';
import { NotFoundError } from './utils/app-error';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS setup supporting client cookies & headers
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Morgan HTTP request logging piped to Winston
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
app.use(
  morgan(
    env.NODE_ENV === 'development' ? 'dev' : ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream }
  )
);

// 5. Global API Rate Limiter
app.use('/api', apiLimiter);

// 6. Register Router under base /api
app.use('/api', routes);

// 7. Route not found fallback
app.use('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Resource not found for ${req.method} ${req.originalUrl}`));
});

// 8. Global Central Error Handler
app.use(errorHandler);

export default app;
