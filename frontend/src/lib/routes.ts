export const ROUTES = {
  login: '/login',
  register: '/register',
  tasks: '/tasks',
} as const;

export const AUTH_PAGES: readonly string[] = [ROUTES.login, ROUTES.register];

// Must match the cookie set by the backend; middleware can only check that it exists.
export const AUTH_COOKIE_NAME = 'access_token';
