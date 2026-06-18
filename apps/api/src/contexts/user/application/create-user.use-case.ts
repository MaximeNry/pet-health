import { Inject, Injectable } from '@nestjs/common';
import { Password } from '../domain/password.vo';
import { PASSWORD_HASHER } from '../domain/password-hasher.port';
import type { PasswordHasher } from '../domain/password-hasher.port';
import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';
import {
  EmailAlreadyTakenError,
  InvalidUserError,
} from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface CreateUserCommand {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Creates a user. Orchestrates the domain: checks the confirmation, validates
 * the plaintext password (Password value object), hashes it through the
 * `PasswordHasher` port, then hands the *hash* to the entity. The plaintext
 * never reaches the domain entity.
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    if (command.password !== command.confirmPassword) {
      throw new InvalidUserError('The password confirmation does not match.');
    }

    const password = Password.create(command.password);

    const existing = await this.users.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyTakenError(command.email);
    }

    const passwordHash = await this.hasher.hash(password.value);

    const user = User.create({
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      passwordHash,
      role: Role.create('USER'),
    });

    await this.users.save(user);
    return user;
  }
}
