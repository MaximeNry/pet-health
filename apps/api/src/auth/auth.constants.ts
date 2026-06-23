/** Name of the httpOnly cookie carrying the app session JWT. */
export const ACCESS_TOKEN_COOKIE = 'access_token';

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
