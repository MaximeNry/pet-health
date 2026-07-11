import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  GeneratedInvitationToken,
  InvitationTokenService,
} from '../domain/invitation-token.port';

/**
 * Node crypto adapter for the `InvitationTokenService` port: 32 random bytes,
 * base64url-encoded for a URL-safe link, hashed with SHA-256 for storage.
 */
@Injectable()
export class Sha256InvitationTokenAdapter implements InvitationTokenService {
  generate(): GeneratedInvitationToken {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
