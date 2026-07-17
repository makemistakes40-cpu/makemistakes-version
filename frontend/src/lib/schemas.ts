import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export const signupFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  role: z.enum(['STUDENT', 'RECRUITER']),
  
  // Student Profile details
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
  message: 'All educational and career details are required for student registration.',
  path: ['college'],
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;
