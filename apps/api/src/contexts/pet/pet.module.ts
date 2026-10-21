import { Module } from '@nestjs/common';
import { HealthDocumentModule } from '../health-document/health-document.module';
import { ReminderModule } from '../reminder/reminder.module';
import { CreatePetUseCase } from './application/create-pet.use-case';
import { DeletePetUseCase } from './application/delete-pet.use-case';
import { GetPetUseCase } from './application/get-pet.use-case';
import { ListPetsByHouseholdUseCase } from './application/list-pets-by-household.use-case';
import { PetTeardownService } from './application/pet-teardown.service';
import { UpdatePetUseCase } from './application/update-pet.use-case';
import { PET_REPOSITORY } from './domain/pet.repository';
import { PrismaPetRepository } from './infrastructure/prisma-pet.repository';
import { PetController } from './presentation/pet.controller';

/**
 * `pet` bounded context (supporting). The `PetRepository` port is bound to its
 * Prisma adapter via a token (TS interfaces don't exist at runtime).
 * `PrismaService` is provided globally by `PrismaModule`. The health-document
 * and reminder modules are imported so a pet deletion can cascade through
 * their ports (`PetTeardownService`).
 */
@Module({
  imports: [HealthDocumentModule, ReminderModule],
  controllers: [PetController],
  providers: [
    CreatePetUseCase,
    GetPetUseCase,
    ListPetsByHouseholdUseCase,
    UpdatePetUseCase,
    DeletePetUseCase,
    PetTeardownService,
    { provide: PET_REPOSITORY, useClass: PrismaPetRepository },
  ],
  // Exported for the household teardown (and account-deletion) flows.
  exports: [PET_REPOSITORY, PetTeardownService],
})
export class PetModule {}
