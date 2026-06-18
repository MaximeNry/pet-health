import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (user === null) {
      throw new UserNotFoundError(id);
    }
    return user;
  }
}
