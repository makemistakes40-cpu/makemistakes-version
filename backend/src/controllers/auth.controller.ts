import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { tokenService } from '../services/token.service';
import { auditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Client-readable cookie to support client-side hydration checking
  res.cookie('loggedIn', 'true', {
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearCookies = (res: Response) => {
  const isProduction = env.NODE_ENV === 'production';

  res.clearCookie('accessToken', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
  res.clearCookie('loggedIn', { secure: isProduction, sameSite: 'lax' });
};

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.register(req.body);

      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = await tokenService.generateRefreshToken(user);

      setCookies(res, accessToken, refreshToken);

      await auditService.log({
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { email: user.email, role: user.role },
      });

      res.status(201).json({
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, session } = await authService.login(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = await tokenService.generateRefreshToken(user);

      setCookies(res, accessToken, refreshToken);

      await auditService.log({
        userId: user.id,
        action: 'USER_LOGGED_IN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { sessionId: session.id },
      });

      res.status(200).json({
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const cookiesToken = req.cookies?.refreshToken;
        if (cookiesToken) {
          await tokenService.revokeToken(cookiesToken);
        }
        await authService.logout(req.user.id);

        await auditService.log({
          userId: req.user.id,
          action: 'USER_LOGGED_OUT',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      clearCookies(res);
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out.',
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        clearCookies(res);
        return res.status(401).json({ status: 'fail', message: 'No refresh token provided.' });
      }

      const { accessToken, refreshToken, user } = await tokenService.verifyAndRotateRefreshToken(token);

      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      clearCookies(res);
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
