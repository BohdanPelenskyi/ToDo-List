import { z } from 'zod';

// These rules mirror backend/src/modules/auth/auth.schemas.ts; the server stays the authority.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(255, 'Email is too long'));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${String(MAX_PASSWORD_LENGTH)} characters`)
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one digit'),
  // An untouched input submits '', which means "no name".
  name: z
    .string()
    .trim()
    .max(MAX_NAME_LENGTH, `Name must be at most ${String(MAX_NAME_LENGTH)} characters`)
    .transform((name) => name || undefined),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormData = z.output<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterFormData = z.output<typeof registerSchema>;
