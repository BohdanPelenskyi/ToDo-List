import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, apiClient } from './api-client';
import { AUTH_PAGES, ROUTES } from './routes';

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

let isSigningOut = false;

// Retrying a 4xx cannot succeed (bad input, missing session), so only transient failures retry.
export function shouldRetry(failureCount: number, error: Error): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

export function handleUnauthorized(queryClient: QueryClient, error: Error): void {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  // A rejected login or registration is an expected 401 and is shown by the form itself.
  if (AUTH_PAGES.some((page) => window.location.pathname.startsWith(page))) return;
  if (isSigningOut) return;
  isSigningOut = true;

  queryClient.clear();
  // Only the server can remove the httpOnly cookie. Leaving it would make the middleware
  // send /login straight back to /tasks, looping forever.
  void apiClient
    .post<undefined>('/auth/logout')
    .catch(() => undefined)
    .finally(() => {
      isSigningOut = false;
      window.location.assign(ROUTES.login);
    });
}

export function makeQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleUnauthorized(queryClient, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleUnauthorized(queryClient, error);
      },
    }),
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry },
    },
  });
  return queryClient;
}
