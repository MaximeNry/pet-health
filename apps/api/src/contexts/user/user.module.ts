import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/create-user.use-case';
import { PASSWORD_HASHER } from './domain/password-hasher.port';
import { USER_REPOSITORY } from './domain/user.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher.adapter';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UserController } from './presentation/user.controller';

/**
 * `user` bounded context (generic subdomain). Ports are bound to their adapters
 * via tokens (TS interfaces don't exist at runtime): `UserRepository` → Prisma,
 * `PasswordHasher` → argon2. `PrismaService` is provided globally by
 * `PrismaModule`.
 */
@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
})
export class UserModule {}
