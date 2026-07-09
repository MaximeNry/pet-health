import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Triggers the Google OAuth flow (redirect, then callback).
 * `accessType: offline` + `prompt: consent` make Google return a refresh
 * token on every login — needed by the health-document context to upload to
 * Drive long after the short-lived access token has expired.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(): { accessType: string; prompt: string } {
    return { accessType: 'offline', prompt: 'consent' };
  }
}
