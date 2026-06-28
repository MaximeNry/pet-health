import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 renamed `middleware` to `proxy` (Node.js runtime by default).
 *
 * This is an OPTIMISTIC auth check only: it redirects based on the mere
 * presence of the session cookie, without validating the JWT. The real
 * authority stays the API's global auth guard, which verifies the token on
 * every request. The proxy just avoids rendering protected pages (and the
 * content flash) for visitors who clearly have no session.
 */

/**
 * Name of the session cookie minted by the API (see `auth.constants.ts`:
 * `ACCESS_TOKEN_COOKIE`). Must stay in sync with the backend. Cookies are
 * scoped by host, not port, so on `localhost` it is shared between the web
 * app and the API during development.
 */
const SESSION_COOKIE = 'access_token';

/** Routes reachable without a session. */
const PUBLIC_ROUTES = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Signed-out visitor on a protected route → send to login.
  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already-signed-in visitor on a public route → send to the dashboard.
  if (hasSession && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path except API routes, Next.js internals and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
