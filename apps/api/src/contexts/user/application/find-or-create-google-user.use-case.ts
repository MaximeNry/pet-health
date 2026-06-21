import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface FindOrCreateGoogleUserCommand {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Resolves the local `User` for a Google identity: returns the existing one
 * (keyed by the Google `sub`) or creates it on first login. Called by the
 * `auth` module after the id_token has been verified.
 */
@Injectable()
export class FindOrCreateGoogleUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(command: FindOrCreateGoogleUserCommand): Promise<User> {
    const existing = await this.users.findByGoogleId(command.googleId);
    if (existing !== null) {
      return existing;
    }

    const user = User.createFromGoogle({
      googleId: command.googleId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });
    await this.users.save(user);
    return user;
  }
}
