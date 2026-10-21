import { Inject, Injectable } from '@nestjs/common';
import { CalendarDate } from '../domain/calendar-date.vo';
import { Reminder } from '../domain/reminder.entity';
import { InvalidReminderError } from '../domain/reminder.errors';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';

export const DEFAULT_UPCOMING_WINDOW_DAYS = 30;
const MAX_UPCOMING_WINDOW_DAYS = 365;

export interface ListUpcomingHouseholdRemindersQuery {
  householdId: string;
  today: CalendarDate;
  withinDays?: number;
}

/**
 * Active reminders of every pet of a household that are overdue or due
 * within the window — the dashboard's "Upcoming reminders" card.
 */
@Injectable()
export class ListUpcomingHouseholdRemindersUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
  ) {}

  execute(query: ListUpcomingHouseholdRemindersQuery): Promise<Reminder[]> {
    const withinDays = query.withinDays ?? DEFAULT_UPCOMING_WINDOW_DAYS;
    if (
      !Number.isInteger(withinDays) ||
      withinDays < 0 ||
      withinDays > MAX_UPCOMING_WINDOW_DAYS
    ) {
      throw new InvalidReminderError(
        `The window must be a whole number of days between 0 and ${MAX_UPCOMING_WINDOW_DAYS}.`,
      );
    }
    return this.reminders.findActiveByHouseholdDueBy(
      query.householdId,
      query.today.addDays(withinDays),
    );
  }
}
