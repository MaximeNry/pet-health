import { apiClient, API_URL, ApiError } from '@/shared/api/apiClient';
import type { AuthUser } from '@/entities/user';

/** Centralized access to the auth endpoints. UI never calls these directly. */
export const authAdapter = {
  /** The current user, or `null` when the session is missing/expired. */
  async getMe(): Promise<AuthUser | null> {
    try {
      return await apiClient.get<AuthUser>('/auth/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  /** Clears the server-side session cookie. */
  async logout(): Promise<void> {
    await apiClient.post<{ success: boolean }>('/auth/logout');
  },
};

/** URL that starts the Google OAuth flow (full navigation, not client-side). */
export const googleLoginUrl = `${API_URL}/auth/google`;

/**
 * Same flow, but the API sends the browser back to `returnTo` (an in-app
 * path, e.g. an invitation link) after the Google round-trip.
 */
export function googleLoginUrlFor(returnTo: string): string {
  return `${googleLoginUrl}?returnTo=${encodeURIComponent(returnTo)}`;
}
