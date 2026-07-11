import { Module } from '@nestjs/common';
import { HealthDocumentModule } from '../health-document/health-document.module';
import { HouseholdModule } from '../household/household.module';
import { PetModule } from '../pet/pet.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import { DeleteAccountUseCase } from './application/delete-account.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { FindOrCreateGoogleUserUseCase } from './application/find-or-create-google-user.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
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
  // Other contexts' ports, needed by the account-deletion orchestration.
  imports: [HouseholdModule, PetModule, HealthDocumentModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    DeleteAccountUseCase,
    FindOrCreateGoogleUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
  // Exposed so the `auth` module can resolve users from Google and delete
  // the signed-in account.
  exports: [FindOrCreateGoogleUserUseCase, DeleteAccountUseCase],
})
export class UserModule {}
