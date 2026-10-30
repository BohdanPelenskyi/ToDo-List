import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

const ALGORITHM = 'HS256';

export interface IssuedToken {
  token: string;
  maxAgeMs: number;
}

export function issueAccessToken(userId: string): IssuedToken {
  const token = jwt.sign({}, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN,
  });

  // Reading the lifetime back from the token keeps the cookie and the JWT expiry in sync.
  const payload = jwt.decode(token, { json: true });
  if (payload?.iat === undefined || payload.exp === undefined) {
    throw new Error('Issued token is missing iat/exp claims');
  }

  return { token, maxAgeMs: (payload.exp - payload.iat) * 1000 };
}

export function verifyAccessToken(token: string): string {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }

  if (typeof payload === 'string' || !payload.sub) {
    throw AppError.unauthorized('Invalid or expired token');
  }
  return payload.sub;
}
