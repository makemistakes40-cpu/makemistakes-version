import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { tokenRepository } from '../repositories/token.repository';
import { Role, User } from '@prisma/client';
import { UnauthorizedError } from '../utils/app-error';

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export class TokenService {
  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    // Store in DB with 7 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await tokenRepository.createRefreshToken({
      token,
      userId: user.id,
      expiresAt,
    });

    return token;
  }

  async verifyAndRotateRefreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    try {
      jwt.verify(token, env.JWT_REFRESH_SECRET);
      
      const storedToken = await tokenRepository.findRefreshToken(token);
      
      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        // If token reuse/compromise is suspected, revoke all tokens for this user
        if (storedToken) {
          await tokenRepository.revokeAllUserTokens(storedToken.userId);
        }
        throw new UnauthorizedError('Invalid or expired session. Please log in.');
      }

      const user = storedToken.user;
      
      // Revoke the old refresh token
      await tokenRepository.revokeRefreshToken(token);

      // Generate a new set of tokens (Rotation)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedError('Session validation failed. Please log in.');
    }
  }

  async revokeToken(token: string): Promise<void> {
    await tokenRepository.revokeRefreshToken(token);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await tokenRepository.revokeAllUserTokens(userId);
  }
}
export const tokenService = new TokenService();
