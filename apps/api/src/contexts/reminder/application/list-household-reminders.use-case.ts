import { Inject, Injectable } from '@nestjs/common';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';

/**
 * Every reminder of a household, active and archived, with their history —
 * the reminders page (its "Upcoming" and "Done" views split it client-side).
 */
@Injectable()
export class ListHouseholdRemindersUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
  ) {}

  execute(householdId: string): Promise<Reminder[]> {
    return this.reminders.findByHouseholdId(householdId);
  }
}
