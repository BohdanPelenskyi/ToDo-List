import { ApiError } from '@/lib/api-client';
import { getAuthErrorMessage } from './auth-error-message';

describe('getAuthErrorMessage', () => {
  it.each([
    ['a failed login', 401, 'login', 'Incorrect email or password.'],
    [
      'a duplicate registration',
      409,
      'register',
      'An account with this email already exists. Try signing in instead.',
    ],
    ['invalid input', 400, 'login', 'Please check the form and try again.'],
    ['rate limiting', 429, 'login', 'Too many attempts. Please wait a few minutes and try again.'],
    ['a server error', 500, 'register', 'Something went wrong. Please try again.'],
  ] as const)('describes %s', (_label, status, action, expected) => {
    const error = new ApiError(status, 'ANY', 'raw server message');

    expect(getAuthErrorMessage(error, action)).toBe(expected);
  });

  it('describes a network failure', () => {
    const error = new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server');

    expect(getAuthErrorMessage(error, 'login')).toBe(
      'Unable to reach the server. Check your connection and try again.',
    );
  });

  it('never leaks the raw message of an unexpected error', () => {
    expect(getAuthErrorMessage(new Error('stack trace here'), 'login')).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
