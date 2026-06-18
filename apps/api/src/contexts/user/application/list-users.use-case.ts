import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  execute(): Promise<User[]> {
    return this.users.findAll();
  }
}
