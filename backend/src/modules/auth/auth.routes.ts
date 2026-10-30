import { Router } from 'express';
import { authRateLimiter } from '../../middlewares/rate-limit';
import { requireAuth } from '../../middlewares/require-auth';
import { asyncHandler } from '../../utils/async-handler';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, asyncHandler(authController.register));
authRouter.post('/login', authRateLimiter, asyncHandler(authController.login));
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
