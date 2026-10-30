import { ApiError } from './api-client';

// A short, actionable hint to append to "Could not ..." messages.
export function describeError(error: Error): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return 'Check your connection and try again.';
    if (error.status === 429) return 'Too many requests. Please wait a moment.';
  }
  return 'Please try again.';
}
