/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const INVITATION_TOKEN_SERVICE = 'InvitationTokenService';

/** A freshly generated link token and the only form of it we may persist. */
export interface GeneratedInvitationToken {
  /** Raw token — returned once inside the invitation link, never stored. */
  token: string;
  /** SHA-256 hex digest of the raw token — the persisted lookup key. */
  tokenHash: string;
}

/**
 * Token generation/hashing PORT. Kept out of the domain entities so the
 * domain stays free of runtime crypto APIs; implemented in infrastructure.
 */
export interface InvitationTokenService {
  /** Generates 32 random bytes (url-safe encoded) and their SHA-256 hash. */
  generate(): GeneratedInvitationToken;
  /** Hashes an incoming raw token for lookup against `tokenHash`. */
  hash(token: string): string;
}
