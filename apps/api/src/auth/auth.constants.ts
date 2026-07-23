import type { CookieOptions } from 'express';

/** Name of the httpOnly cookie carrying the app session JWT. */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Options for the session cookie, shared by the code that sets it and the code
 * that clears it (both must agree on domain/sameSite/secure or the browser
 * won't overwrite/delete the cookie).
 *
 * When `COOKIE_DOMAIN` is set (production, where web and API live on distinct
 * subdomains of the same parent — e.g. `app.` and `api.pethealth.xyz`), the
 * cookie is scoped to that parent so both origins share it, which requires
 * `SameSite=None; Secure`. Without it (local dev on `localhost:<port>`, a
 * single site) we keep `SameSite=Lax` and no explicit domain.
 */
export function sessionCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN;
  const crossSite = Boolean(domain);
  return {
    httpOnly: true,
    // SameSite=None mandates Secure; in prod we serve over HTTPS anyway.
    secure: crossSite || process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
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
