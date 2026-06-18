/**
 * Port: the domain declares the need to hash and verify passwords, without
 * knowing how. The concrete algorithm (argon2) lives in an infrastructure
 * adapter — same pattern as the `DocumentStorage` port hiding Google Drive.
 */
export const PASSWORD_HASHER = 'PasswordHasher';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}
