import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * A `returnTo` path is only trusted when it is a same-origin absolute path
 * ("/invite/abc"), never a full URL — prevents open redirects via the OAuth
 * state parameter.
 */
export function safeReturnPath(value: unknown): string | undefined {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : undefined;
}

/**
 * Triggers the Google OAuth flow (redirect, then callback).
 * `accessType: offline` + `prompt: consent` make Google return a refresh
 * token on every login — needed by the health-document context to upload to
 * Drive long after the short-lived access token has expired.
 *
 * An optional `?returnTo=/path` on the login URL rides through Google in the
 * OAuth `state` parameter, so the callback can send the browser back to where
 * the flow started (e.g. an invitation link).
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): {
    accessType: string;
    prompt: string;
    state?: string;
  } {
    const request = context.switchToHttp().getRequest<Request>();
    const returnTo = safeReturnPath(request.query.returnTo);
    return {
      accessType: 'offline',
      prompt: 'consent',
      ...(returnTo !== undefined && { state: returnTo }),
    };
  }
}
