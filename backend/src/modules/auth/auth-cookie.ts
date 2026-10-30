import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env';

export const AUTH_COOKIE_NAME = 'access_token';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
    path: '/',
  };
}

export function setAuthCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: maxAgeMs });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}
