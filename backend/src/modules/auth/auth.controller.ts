import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../middlewares/require-auth';
import { clearAuthCookie, setAuthCookie } from './auth-cookie';
import { loginSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';
import { issueAccessToken } from './token';
import { serializeUser } from './user.serializer';

function startSession(res: Response, userId: string): void {
  const { token, maxAgeMs } = issueAccessToken(userId);
  setAuthCookie(res, token, maxAgeMs);
}

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.register(registerSchema.parse(req.body));

  startSession(res, user.id);
  res.status(201).json({ user: serializeUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const user = await authService.login(loginSchema.parse(req.body));

  startSession(res, user.id);
  res.json({ user: serializeUser(user) });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(getAuthenticatedUserId(req));

  res.json({ user: serializeUser(user) });
}
