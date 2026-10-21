import { Inject, Injectable } from '@nestjs/common';
import { HEALTH_DOCUMENT_DIRECTORY } from '../domain/health-document-directory.port';
import type { HealthDocumentDirectory } from '../domain/health-document-directory.port';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { assertDocumentOfPet } from './assert-document-of-pet';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

export interface AttachCompletionProofCommand {
  petId: string;
  reminderId: string;
  completionId: string;
  /** `null` detaches the current proof. */
  healthDocumentId: string | null;
}

/** Attaches a scanned proof to a completion already recorded. */
@Injectable()
export class AttachCompletionProofUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    @Inject(HEALTH_DOCUMENT_DIRECTORY)
    private readonly documents: HealthDocumentDirectory,
    private readonly getReminder: GetPetReminderUseCase,
  ) {}

  async execute(command: AttachCompletionProofCommand): Promise<Reminder> {
    const reminder = await this.getReminder.execute(
      command.petId,
      command.reminderId,
    );
    await assertDocumentOfPet(
      this.documents,
      command.petId,
      command.healthDocumentId,
    );
    reminder.attachProof(command.completionId, command.healthDocumentId);
    await this.reminders.save(reminder);
    return reminder;
  }
}
