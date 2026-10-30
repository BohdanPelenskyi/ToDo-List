import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;
// bcrypt ignores everything past 72 bytes, so a longer password would silently lose its tail.
// The limit is in bytes, not characters: a Cyrillic letter takes two bytes in UTF-8.
const MAX_PASSWORD_BYTES = 72;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(255));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`)
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES,
      `Password is too long (at most ${String(MAX_PASSWORD_BYTES)} bytes; letters outside Latin, such as Cyrillic, take two)`,
    )
    // \p{L} is a letter of any alphabet (Latin, Cyrillic, ...), \p{Nd} a decimal digit.
    .regex(/\p{L}/u, 'Password must contain at least one letter')
    .regex(/\p{Nd}/u, 'Password must contain at least one digit'),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
