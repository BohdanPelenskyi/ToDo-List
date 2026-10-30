import type { Response } from 'express';
import { env } from '../../src/config/env';
import { setAuthCookie } from '../../src/modules/auth/auth-cookie';

jest.mock('../../src/config/env', () => ({ env: { NODE_ENV: 'test', COOKIE_SECURE: undefined } }));

function issueCookieOptions(): Record<string, unknown> {
  const cookie = jest.fn();
  setAuthCookie({ cookie } as unknown as Response, 'token', 1000);
  return (cookie.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
}

describe('setAuthCookie', () => {
  it('is httpOnly and SameSite=Lax with the token lifetime', () => {
    expect(issueCookieOptions()).toMatchObject({ httpOnly: true, sameSite: 'lax', maxAge: 1000 });
  });

  it.each([
    ['production', undefined, true],
    ['development', undefined, false],
    ['production', false, false],
    ['development', true, true],
  ] as const)(
    'with NODE_ENV=%s and COOKIE_SECURE=%s sets secure=%s',
    (nodeEnv, override, expected) => {
      env.NODE_ENV = nodeEnv;
      env.COOKIE_SECURE = override;

      expect(issueCookieOptions()).toMatchObject({ secure: expected });
    },
  );
});
