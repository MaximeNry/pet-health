import type { UserProfile } from './types';

/** Up-to-two-letter initials for an avatar, from a profile or a raw email. */
export function initials(profile?: UserProfile, email?: string): string {
  if (profile && (profile.firstName || profile.lastName)) {
    const first = profile.firstName.charAt(0);
    const last = profile.lastName.charAt(0);
    return (first + last).toUpperCase() || first.toUpperCase();
  }
  const source = profile?.email ?? email ?? '';
  return source.slice(0, 2).toUpperCase();
}

/** Full display name, falling back to the email when no name is set. */
export function displayName(profile?: UserProfile, email?: string): string {
  if (profile) {
    const full = `${profile.firstName} ${profile.lastName}`.trim();
    return full || profile.email;
  }
  return email ?? '';
}
