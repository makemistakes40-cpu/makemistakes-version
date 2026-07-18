import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/database';
import { Role, User } from '@prisma/client';
import { ConflictError, UnauthorizedError } from '../utils/app-error';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    
    // Optional Student Profile fields
    college?: string;
    degree?: string;
    branch?: string;
    currentYear?: string;
    programmingLevel?: string;
    interestedCareer?: string;
    preferredLanguage?: string;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
  }): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictError('A user with this email address already exists.');
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(data.password, salt);

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
      });

      if (data.role === Role.STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            college: data.college!,
            degree: data.degree!,
            branch: data.branch!,
            currentYear: data.currentYear!,
            programmingLevel: data.programmingLevel!,
            interestedCareer: data.interestedCareer!,
            preferredLanguage: data.preferredLanguage!,
            githubUrl: data.githubUrl || null,
            linkedinUrl: data.linkedinUrl || null,
          },
        });
      }

      return user;
    });
  }

  async login(data: {
    email: string;
    password: string;
  }, sessionMeta: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: User; session: any }> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check account lockout
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      const minsLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
      throw new UnauthorizedError(`Account locked due to repeated failed logins. Please try again in ${minsLeft} minutes.`);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockoutUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts >= 5 ? 0 : attempts,
          lockoutUntil,
        },
      });

      if (attempts >= 5) {
        throw new UnauthorizedError('Account locked due to repeated failed logins. Please try again in 15 minutes.');
      }
      throw new UnauthorizedError(`Invalid email or password. Attempt ${attempts} of 5.`);
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // Create session record in DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: sessionMeta.ipAddress || null,
        userAgent: sessionMeta.userAgent || null,
        isActive: true,
      },
    });

    return { user, session };
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } else {
      await prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }
  }
}

export const authService = new AuthService();
