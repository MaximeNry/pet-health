import { Inject, Injectable } from '@nestjs/common';
import { CalendarDate } from '../domain/calendar-date.vo';
import { HEALTH_DOCUMENT_DIRECTORY } from '../domain/health-document-directory.port';
import type { HealthDocumentDirectory } from '../domain/health-document-directory.port';
import { PET_DIRECTORY } from '../domain/pet-directory.port';
import type { PetDirectory } from '../domain/pet-directory.port';
import type { RecurrenceProps } from '../domain/recurrence.vo';
import { Reminder } from '../domain/reminder.entity';
import { ReminderPetNotFoundError } from '../domain/reminder.errors';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { assertDocumentOfPet } from './assert-document-of-pet';

export interface CreateReminderCommand {
  petId: string;
  userId: string;
  title: string;
  category: string;
  /** `YYYY-MM-DD`; optional when `lastDoneOn` is given. */
  dueDate?: string;
  recurrence?: RecurrenceProps | null;
  /** The record the reminder is created from ("Based on a record"). */
  healthDocumentId?: string | null;
  /**
   * `YYYY-MM-DD`: the care was already given that day (e.g. the date of the
   * scanned vaccination). Recorded as the first completion, with the
   * document as its proof.
   */
  lastDoneOn?: string;
  today: CalendarDate;
}

/**
 * Creates a reminder for a pet, optionally from one of its documents. The
 * household id is resolved from the pet, never taken from the client:
 * otherwise a member could file a reminder under another household's
 * dashboard.
 */
@Injectable()
export class CreateReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    @Inject(PET_DIRECTORY) private readonly pets: PetDirectory,
    @Inject(HEALTH_DOCUMENT_DIRECTORY)
    private readonly documents: HealthDocumentDirectory,
  ) {}

  async execute(command: CreateReminderCommand): Promise<Reminder> {
    const householdId = await this.pets.findHouseholdIdOfPet(command.petId);
    if (householdId === null) {
      throw new ReminderPetNotFoundError(command.petId);
    }
    await assertDocumentOfPet(
      this.documents,
      command.petId,
      command.healthDocumentId,
    );
    const reminder = Reminder.create(
      {
        petId: command.petId,
        householdId,
        createdBy: command.userId,
        title: command.title,
        category: command.category,
        dueDate: command.dueDate ? CalendarDate.parse(command.dueDate) : null,
        recurrence: command.recurrence,
        sourceDocumentId: command.healthDocumentId,
        lastDone: command.lastDoneOn
          ? {
              doneOn: CalendarDate.parse(command.lastDoneOn),
              healthDocumentId: command.healthDocumentId,
            }
          : null,
      },
      command.today,
    );
    await this.reminders.save(reminder);
    return reminder;
  }
}
