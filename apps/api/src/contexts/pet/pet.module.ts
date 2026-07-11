import { Module } from '@nestjs/common';
import { CreatePetUseCase } from './application/create-pet.use-case';
import { DeletePetUseCase } from './application/delete-pet.use-case';
import { GetPetUseCase } from './application/get-pet.use-case';
import { ListPetsByHouseholdUseCase } from './application/list-pets-by-household.use-case';
import { UpdatePetUseCase } from './application/update-pet.use-case';
import { PET_REPOSITORY } from './domain/pet.repository';
import { PrismaPetRepository } from './infrastructure/prisma-pet.repository';
import { PetController } from './presentation/pet.controller';

/**
 * `pet` bounded context (supporting). The `PetRepository` port is bound to its
 * Prisma adapter via a token (TS interfaces don't exist at runtime).
 * `PrismaService` is provided globally by `PrismaModule`.
 */
@Module({
  controllers: [PetController],
  providers: [
    CreatePetUseCase,
    GetPetUseCase,
    ListPetsByHouseholdUseCase,
    UpdatePetUseCase,
    DeletePetUseCase,
    { provide: PET_REPOSITORY, useClass: PrismaPetRepository },
  ],
  // Exported for the user context's account-deletion flow.
  exports: [PET_REPOSITORY],
})
export class PetModule {}
