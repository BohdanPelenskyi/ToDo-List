import { ApiError } from '@/lib/api-client';

type AuthAction = 'login' | 'register';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export function getAuthErrorMessage(error: Error, action: AuthAction): string {
  if (!(error instanceof ApiError)) return GENERIC_MESSAGE;

  if (error.status === 401 && action === 'login') return 'Incorrect email or password.';
  if (error.status === 409 && action === 'register') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (error.status === 400) return 'Please check the form and try again.';
  if (error.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (error.code === 'NETWORK_ERROR') {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  return GENERIC_MESSAGE;
}
