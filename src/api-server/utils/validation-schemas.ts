import { z } from 'zod';
import { Role } from '@prisma/client';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.nativeEnum(Role).default(Role.STUDENT),
    
    // Educational & Career fields
    college: z.string().optional(),
    degree: z.string().optional(),
    branch: z.string().optional(),
    currentYear: z.string().optional(),
    programmingLevel: z.string().optional(),
    interestedCareer: z.string().optional(),
    preferredLanguage: z.string().optional(),
    githubUrl: z.string().url('Invalid GitHub URL').or(z.string().length(0)).optional().nullable(),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.string().length(0)).optional().nullable(),
  }).refine((data) => {
    if (data.role === 'STUDENT') {
      return (
        !!data.college &&
        !!data.degree &&
        !!data.branch &&
        !!data.currentYear &&
        !!data.programmingLevel &&
        !!data.interestedCareer &&
        !!data.preferredLanguage
      );
    }
    return true;
  }, {
    message: 'All student profile details are required for student accounts.',
    path: ['college'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
