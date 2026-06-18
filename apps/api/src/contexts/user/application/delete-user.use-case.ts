import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/** Deletes a user after ensuring it exists. */
@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.users.findById(id);
    if (user === null) {
      throw new UserNotFoundError(id);
    }
    await this.users.delete(id);
  }
}
