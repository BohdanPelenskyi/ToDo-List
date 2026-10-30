import { z } from 'zod';

// These rules mirror backend/src/modules/auth/auth.schemas.ts; the server stays the authority.
const MIN_PASSWORD_LENGTH = 8;
// bcrypt only uses the first 72 bytes. The limit counts bytes, not characters, because a Cyrillic
// letter takes two bytes in UTF-8.
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 100;

const utf8Encoder = new TextEncoder();

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
    .refine(
      (password) => utf8Encoder.encode(password).length <= MAX_PASSWORD_BYTES,
      `Password is too long (at most ${String(MAX_PASSWORD_BYTES)} bytes; Cyrillic letters take two)`,
    )
    // \p{L} is a letter of any alphabet (Latin, Cyrillic, ...), \p{Nd} a decimal digit.
    .regex(/\p{L}/u, 'Password must contain at least one letter')
    .regex(/\p{Nd}/u, 'Password must contain at least one digit'),
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
