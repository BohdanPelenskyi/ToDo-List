import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_PAGES, ROUTES } from '@/lib/routes';

// The URL Next.js sees in a standalone/Docker build is the internal one (localhost), so redirects
// are built from the host and protocol the browser actually used.
function redirectTo(request: NextRequest, pathname: string) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const protocol =
    request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.slice(0, -1);
  const base = host ? `${protocol}://${host}` : request.url;
  return NextResponse.redirect(new URL(pathname, base));
}

// Only checks that a session cookie exists; the API remains the source of truth for validity.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);
  const isAuthPage = AUTH_PAGES.includes(request.nextUrl.pathname);

  if (!hasSession && !isAuthPage) return redirectTo(request, ROUTES.login);
  if (hasSession && isAuthPage) return redirectTo(request, ROUTES.tasks);
  return NextResponse.next();
}

export const config = {
  matcher: ['/tasks/:path*', '/login', '/register'],
};
