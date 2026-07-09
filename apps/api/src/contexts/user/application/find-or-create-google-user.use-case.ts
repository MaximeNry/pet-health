import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface FindOrCreateGoogleUserCommand {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Drive refresh token from the OAuth exchange; absent on some logins. */
  googleRefreshToken?: string;
}

/**
 * Resolves the local `User` for a Google identity: returns the existing one
 * (keyed by the Google `sub`) or creates it on first login. Called by the
 * `auth` module after the id_token has been verified. When Google issues a
 * fresh refresh token, it replaces the stored one (a re-consent revokes the
 * previous token).
 */
@Injectable()
export class FindOrCreateGoogleUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(command: FindOrCreateGoogleUserCommand): Promise<User> {
    const existing = await this.users.findByGoogleId(command.googleId);
    if (existing !== null) {
      if (
        command.googleRefreshToken &&
        command.googleRefreshToken !== existing.googleRefreshToken
      ) {
        existing.storeGoogleRefreshToken(command.googleRefreshToken);
        await this.users.save(existing);
      }
      return existing;
    }

    const user = User.createFromGoogle({
      googleId: command.googleId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      googleRefreshToken: command.googleRefreshToken ?? null,
    });
    await this.users.save(user);
    return user;
  }
}
