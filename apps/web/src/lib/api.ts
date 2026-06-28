/** Base URL of the NestJS API (browser-side calls). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Shape returned by `GET /auth/me`. */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Returns the authenticated user, or `null` if the session is missing/expired.
 * `credentials: 'include'` sends the httpOnly session cookie cross-origin
 * (the API enables CORS with credentials for this).
 */
export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Unexpected response from /auth/me: ${res.status}`);
  }
  return (await res.json()) as AuthUser;
}

/** Clears the session (server-side cookie). */
export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

/** URL that starts the Google OAuth flow (full navigation, not client-side). */
export const googleLoginUrl = `${API_URL}/auth/google`;
