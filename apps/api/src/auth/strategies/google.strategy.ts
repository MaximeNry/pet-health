import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { FindOrCreateGoogleUserUseCase } from '../../contexts/user/application/find-or-create-google-user.use-case';

/**
 * Google OAuth strategy (Authorization Code flow). On the callback Passport
 * hands us the verified profile; we resolve the local `User` (find-or-create)
 * and expose it as `req.user`. Identity scopes only for now — the Drive
 * `drive.file` scope + refresh-token storage come with the health-document
 * context.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly findOrCreateGoogleUser: FindOrCreateGoogleUserUseCase,
  ) {
    super({
      // Non-empty dev fallbacks: passport-oauth2 rejects an empty clientID, so
      // these let the app boot without real credentials. Real Google login
      // requires setting GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in the env.
      clientID: process.env.GOOGLE_CLIENT_ID || 'dev-google-client-id',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || 'dev-google-client-secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/google/callback',
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<{ id: string; email: string }> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('The Google account has no email.');
    }

    const firstName =
      profile.name?.givenName ?? profile.displayName ?? email.split('@')[0];
    const lastName = profile.name?.familyName ?? firstName;

    const user = await this.findOrCreateGoogleUser.execute({
      googleId: profile.id,
      email,
      firstName,
      lastName,
    });

    return { id: user.id, email: user.email };
  }
}
