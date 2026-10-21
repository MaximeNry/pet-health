import { Inject, Injectable } from '@nestjs/common';
import { CalendarDate } from '../domain/calendar-date.vo';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

export interface CompleteReminderCommand {
  petId: string;
  reminderId: string;
  userId: string;
  /** `YYYY-MM-DD`; defaults to `today`. */
  doneOn?: string;
  healthDocumentId?: string | null;
  today: CalendarDate;
}

/**
 * Marks the care as done. The entity moves a recurring reminder to its next
 * occurrence (from the day it was actually done) or archives a one-off one.
 */
@Injectable()
export class CompleteReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    private readonly getReminder: GetPetReminderUseCase,
  ) {}

  async execute(command: CompleteReminderCommand): Promise<Reminder> {
    const reminder = await this.getReminder.execute(
      command.petId,
      command.reminderId,
    );
    reminder.complete(
      {
        doneOn: command.doneOn
          ? CalendarDate.parse(command.doneOn)
          : command.today,
        doneBy: command.userId,
        healthDocumentId: command.healthDocumentId,
      },
      command.today,
    );
    await this.reminders.save(reminder);
    return reminder;
  }
}
