import type { Request, RequestHandler } from 'express';
import { AUTH_COOKIE_NAME } from '../modules/auth/auth-cookie';
import { verifyAccessToken } from '../modules/auth/token';
import { AppError } from '../utils/app-error';

const BEARER_PREFIX = 'Bearer ';

function extractToken(req: Request): string | undefined {
  const cookieToken: unknown = req.cookies[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;

  const authorization = req.headers.authorization;
  if (authorization?.startsWith(BEARER_PREFIX)) {
    return authorization.slice(BEARER_PREFIX.length);
  }

  return undefined;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  req.userId = verifyAccessToken(token);
  next();
};

export function getAuthenticatedUserId(req: Request): string {
  if (!req.userId) {
    throw AppError.unauthorized();
  }
  return req.userId;
}
