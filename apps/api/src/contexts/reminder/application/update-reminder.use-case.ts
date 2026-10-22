import { Inject, Injectable } from '@nestjs/common';
import { CalendarDate } from '../domain/calendar-date.vo';
import type { RecurrenceProps } from '../domain/recurrence.vo';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

/** Omitted = untouched; `recurrence: null` = make the reminder one-off. */
export interface UpdateReminderCommand {
  petId: string;
  reminderId: string;
  title?: string;
  category?: string;
  recurrence?: RecurrenceProps | null;
  /** `YYYY-MM-DD`; moves the next due date by hand. */
  dueDate?: string;
}

/**
 * Edits a reminder. The description is applied first, then an explicit due
 * date, so a recurrence change and a manual date sent together end on the
 * date the user picked.
 */
@Injectable()
export class UpdateReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    private readonly getReminder: GetPetReminderUseCase,
  ) {}

  async execute(command: UpdateReminderCommand): Promise<Reminder> {
    const reminder = await this.getReminder.execute(
      command.petId,
      command.reminderId,
    );
    reminder.edit({
      title: command.title,
      category: command.category,
      recurrence: command.recurrence,
    });
    if (command.dueDate !== undefined) {
      reminder.reschedule(CalendarDate.parse(command.dueDate));
    }
    await this.reminders.save(reminder);
    return reminder;
  }
}
