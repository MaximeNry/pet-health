import { Inject, Injectable } from '@nestjs/common';
import { CalendarDate } from '../domain/calendar-date.vo';
import { PET_DIRECTORY } from '../domain/pet-directory.port';
import type { PetDirectory } from '../domain/pet-directory.port';
import type { RecurrenceProps } from '../domain/recurrence.vo';
import { Reminder } from '../domain/reminder.entity';
import { ReminderPetNotFoundError } from '../domain/reminder.errors';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';

export interface CreateReminderCommand {
  petId: string;
  userId: string;
  title: string;
  category: string;
  /** `YYYY-MM-DD`. */
  dueDate: string;
  recurrence?: RecurrenceProps | null;
}

/**
 * Creates a reminder for a pet. The household id is resolved from the pet,
 * never taken from the client: otherwise a member could file a reminder
 * under another household's dashboard.
 */
@Injectable()
export class CreateReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    @Inject(PET_DIRECTORY) private readonly pets: PetDirectory,
  ) {}

  async execute(command: CreateReminderCommand): Promise<Reminder> {
    const householdId = await this.pets.findHouseholdIdOfPet(command.petId);
    if (householdId === null) {
      throw new ReminderPetNotFoundError(command.petId);
    }
    const reminder = Reminder.create({
      petId: command.petId,
      householdId,
      createdBy: command.userId,
      title: command.title,
      category: command.category,
      dueDate: CalendarDate.parse(command.dueDate),
      recurrence: command.recurrence,
    });
    await this.reminders.save(reminder);
    return reminder;
  }
}
