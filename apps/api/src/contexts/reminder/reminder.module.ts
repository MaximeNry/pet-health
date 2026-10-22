import { Module } from '@nestjs/common';
import { ArchiveReminderUseCase } from './application/archive-reminder.use-case';
import { AttachCompletionProofUseCase } from './application/attach-completion-proof.use-case';
import { CompleteReminderUseCase } from './application/complete-reminder.use-case';
import { CreateReminderUseCase } from './application/create-reminder.use-case';
import { DeleteReminderUseCase } from './application/delete-reminder.use-case';
import { GetPetReminderUseCase } from './application/get-pet-reminder.use-case';
import { ListHouseholdRemindersUseCase } from './application/list-household-reminders.use-case';
import { ListPetRemindersUseCase } from './application/list-pet-reminders.use-case';
import { ListUpcomingHouseholdRemindersUseCase } from './application/list-upcoming-household-reminders.use-case';
import { UpdateReminderUseCase } from './application/update-reminder.use-case';
import { HEALTH_DOCUMENT_DIRECTORY } from './domain/health-document-directory.port';
import { PET_DIRECTORY } from './domain/pet-directory.port';
import { REMINDER_REPOSITORY } from './domain/reminder.repository';
import { PrismaHealthDocumentDirectoryAdapter } from './infrastructure/prisma-health-document-directory.adapter';
import { PrismaPetDirectoryAdapter } from './infrastructure/prisma-pet-directory.adapter';
import { PrismaReminderRepository } from './infrastructure/prisma-reminder.repository';
import { HouseholdReminderController } from './presentation/household-reminder.controller';
import { PetReminderController } from './presentation/pet-reminder.controller';

/**
 * `reminder` bounded context (supporting). Imports no other context module:
 * the pet's household and a document's pet are read through anti-corruption
 * ports (`PetDirectory`, `HealthDocumentDirectory`), so the pet
 * context can depend on this one to cascade deletions without a cycle.
 * `PrismaService` is provided globally by `PrismaModule`.
 */
@Module({
  controllers: [PetReminderController, HouseholdReminderController],
  providers: [
    CreateReminderUseCase,
    ListPetRemindersUseCase,
    GetPetReminderUseCase,
    UpdateReminderUseCase,
    CompleteReminderUseCase,
    ArchiveReminderUseCase,
    DeleteReminderUseCase,
    ListUpcomingHouseholdRemindersUseCase,
    ListHouseholdRemindersUseCase,
    AttachCompletionProofUseCase,
    { provide: REMINDER_REPOSITORY, useClass: PrismaReminderRepository },
    { provide: PET_DIRECTORY, useClass: PrismaPetDirectoryAdapter },
    {
      provide: HEALTH_DOCUMENT_DIRECTORY,
      useClass: PrismaHealthDocumentDirectoryAdapter,
    },
  ],
  // Exported for the pet-deletion cascade.
  exports: [REMINDER_REPOSITORY],
})
export class ReminderModule {}
