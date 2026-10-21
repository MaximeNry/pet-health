import { CalendarDate } from './calendar-date.vo';
import { Reminder } from './reminder.entity';

/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const REMINDER_REPOSITORY = 'ReminderRepository';

/**
 * Reminder persistence PORT. Defined in the domain; implemented by an
 * infrastructure adapter (Prisma). Loads and saves the whole aggregate,
 * completions included.
 */
export interface ReminderRepository {
  save(reminder: Reminder): Promise<void>;
  findById(id: string): Promise<Reminder | null>;
  findByPetId(petId: string): Promise<Reminder[]>;
  /** Every reminder of the household (active and archived), soonest first. */
  findByHouseholdId(householdId: string): Promise<Reminder[]>;
  /**
   * ACTIVE reminders of the household due on or before `dueOnOrBefore`
   * (overdue ones included), soonest first — feeds the dashboard card.
   */
  findActiveByHouseholdDueBy(
    householdId: string,
    dueOnOrBefore: CalendarDate,
  ): Promise<Reminder[]>;
  deleteById(id: string): Promise<void>;
  deleteByPetId(petId: string): Promise<void>;
}
