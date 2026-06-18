import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import {
  EmailAlreadyTakenError,
  UserNotFoundError,
} from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface UpdateUserCommand {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Loads a user, applies the changes through the entity, then persists. */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.users.findById(command.id);
    if (user === null) {
      throw new UserNotFoundError(command.id);
    }

    // Email stays unique across users: reject a change that collides with
    // another user (the email belonging to this same user is allowed).
    if (command.email !== undefined && command.email !== user.email) {
      const other = await this.users.findByEmail(command.email);
      if (other !== null && other.id !== user.id) {
        throw new EmailAlreadyTakenError(command.email);
      }
    }

    user.update({
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
    });
    await this.users.save(user);
    return user;
  }
}
