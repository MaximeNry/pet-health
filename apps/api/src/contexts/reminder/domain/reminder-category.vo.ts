import { InvalidReminderError } from './reminder.errors';

/** Kinds of care a reminder can track. Fixed list, not customizable. */
export const REMINDER_CATEGORIES = [
  'VACCINE',
  'ANTIPARASITIC',
  'DEWORMING',
  'CHECKUP',
  'OTHER',
] as const;

export type ReminderCategoryValue = (typeof REMINDER_CATEGORIES)[number];

/**
 * Reminder category value object. The category is what the post-scan
 * suggestion uses to find an existing reminder to complete rather than
 * creating a duplicate.
 */
export class ReminderCategory {
  private constructor(private readonly value: ReminderCategoryValue) {}

  static create(raw: string): ReminderCategory {
    if (!REMINDER_CATEGORIES.includes(raw as ReminderCategoryValue)) {
      throw new InvalidReminderError(
        `Invalid reminder category « ${raw} ». Accepted values: ${REMINDER_CATEGORIES.join(', ')}.`,
      );
    }
    return new ReminderCategory(raw as ReminderCategoryValue);
  }

  toString(): ReminderCategoryValue {
    return this.value;
  }

  equals(other: ReminderCategory): boolean {
    return this.value === other.value;
  }
}
