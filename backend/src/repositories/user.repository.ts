import { prisma } from '../config/database';
import { Role, User } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}
export const userRepository = new UserRepository();
