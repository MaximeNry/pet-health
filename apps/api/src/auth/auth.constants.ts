import type { CookieOptions } from 'express';

/** Name of the httpOnly cookie carrying the app session JWT. */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Options for the session cookie, shared by the code that sets it and the code
 * that clears it (both must agree on domain/sameSite/secure or the browser
 * won't overwrite/delete the cookie).
 *
 * `COOKIE_DOMAIN` (production) is the shared parent of the web and API
 * subdomains — e.g. `.pethealth.xyz` for `app.` / `api.pethealth.xyz`. Scoping
 * the cookie to that parent is what makes it visible to BOTH origins: without
 * it the cookie is host-only on the API, so the web proxy/middleware never
 * sees it and bounces every request to `/login`.
 *
 * `SameSite=Lax` is enough because the two subdomains are the *same site*
 * (same registrable domain / eTLD+1): the cross-subdomain `fetch`es from the
 * web are same-site requests, so Lax still carries the cookie while keeping
 * CSRF protection. In dev (localhost, no domain) the behaviour is identical.
 * Only if web and API ever lived on *different* registrable domains would
 * `SameSite=None; Secure` be required.
 */
export function sessionCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: Boolean(domain) || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: domain || undefined,
    path: '/',
  };
}

/** Session lifetime — kept in sync between the JWT and the cookie. */
export const ACCESS_TOKEN_TTL = '7d';
export const ACCESS_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Payload carried by the app session JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** Shape exposed as `req.user` once the session JWT is validated. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}
