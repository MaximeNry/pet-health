import type { DocumentType } from '@/entities/document';
import type {
  Recurrence,
  Reminder,
  ReminderCategory,
  ReminderCompletion,
} from './types';

/**
 * A ready-made reminder ("Rabies booster, every year"). `key` names its
 * translated title (`reminders.presets.<key>`): helpers never return labels.
 */
export interface ReminderPreset {
  key: 'rabies' | 'coreVaccines' | 'antiparasitic' | 'deworming' | 'checkup';
  category: ReminderCategory;
  recurrence: Recurrence;
}

/** The usual care schedules, offered as one-tap starting points. */
export const REMINDER_PRESETS: ReminderPreset[] = [
  { key: 'rabies', category: 'VACCINE', recurrence: { every: 1, unit: 'YEAR' } },
  {
    key: 'coreVaccines',
    category: 'VACCINE',
    recurrence: { every: 1, unit: 'YEAR' },
  },
  {
    key: 'antiparasitic',
    category: 'ANTIPARASITIC',
    recurrence: { every: 3, unit: 'MONTH' },
  },
  {
    key: 'deworming',
    category: 'DEWORMING',
    recurrence: { every: 3, unit: 'MONTH' },
  },
  { key: 'checkup', category: 'CHECKUP', recurrence: { every: 1, unit: 'YEAR' } },
];

/**
 * Presets worth suggesting for a freshly scanned document: a vaccination
 * record → vaccines; a prescription → the usual treatments. Other document
 * types suggest nothing.
 */
export function presetsForDocumentType(type: DocumentType): ReminderPreset[] {
  switch (type) {
    case 'VACCINATION':
      return REMINDER_PRESETS.filter((p) => p.category === 'VACCINE');
    case 'PRESCRIPTION':
      return REMINDER_PRESETS.filter(
        (p) => p.category === 'ANTIPARASITIC' || p.category === 'DEWORMING',
      );
    default:
      return [];
  }
}

/** Per-category colors (chip dot + soft background), from the brand palette. */
export const REMINDER_CATEGORY_PALETTE: Record<
  ReminderCategory,
  { bg: string; fg: string }
> = {
  VACCINE: { bg: 'var(--color-green-50)', fg: 'var(--color-green-600)' },
  ANTIPARASITIC: { bg: 'var(--color-coral-50)', fg: 'var(--color-coral-700)' },
  DEWORMING: { bg: '#FBF1DE', fg: '#946212' },
  CHECKUP: { bg: '#EAF1F9', fg: '#2E6BA8' },
  OTHER: { bg: 'var(--color-stone-100)', fg: 'var(--color-stone-600)' },
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The user's local calendar day as `YYYY-MM-DD`. Sent to the API as
 * `?today=` so "overdue" and "done today" follow the user's clock, not the
 * server's UTC day.
 */
export function localToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * A `YYYY-MM-DD` day as a `Date` at UTC midnight. Format it with
 * `timeZone: 'UTC'` (see `DAY_FORMAT`), or a negative UTC offset would show
 * the previous day.
 */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** Pass to `format.dateTime` together with any day from `dayToDate`. */
export const DAY_FORMAT = { timeZone: 'UTC' } as const;

/** Signed number of days from `from` to `to` (both `YYYY-MM-DD`). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (dayToDate(to).getTime() - dayToDate(from).getTime()) / 86_400_000,
  );
}

/** `day` shifted by `days` (may be negative). */
export function addDays(day: string, days: number): string {
  return new Date(dayToDate(day).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * The next occurrence after `day`, mirroring the API's arithmetic (months
 * clamp to the last day: Jan 31 + 1 month = Feb 28). Used only to preview
 * the date in forms — the API computes the real one.
 */
export function nextOccurrence(day: string, recurrence: Recurrence): string {
  if (recurrence.unit === 'DAY') return addDays(day, recurrence.every);
  if (recurrence.unit === 'WEEK') return addDays(day, recurrence.every * 7);
  const months = recurrence.every * (recurrence.unit === 'YEAR' ? 12 : 1);
  const date = dayToDate(day);
  const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)))
    .toISOString()
    .slice(0, 10);
}

/** Active reminders grouped like the list screen: overdue, next 7 days, later. */
export function groupByUrgency(reminders: Reminder[]): {
  overdue: Reminder[];
  soon: Reminder[];
  later: Reminder[];
} {
  const active = reminders
    .filter((r) => r.status === 'ACTIVE')
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return {
    overdue: active.filter((r) => r.urgency === 'OVERDUE'),
    soon: active.filter((r) => r.urgency === 'DUE_SOON'),
    later: active.filter((r) => r.urgency === 'UPCOMING'),
  };
}

/** Every completion across reminders, most recent first — the "Done" view. */
export function completionHistory(
  reminders: Reminder[],
): { reminder: Reminder; completion: ReminderCompletion }[] {
  return reminders
    .flatMap((reminder) =>
      reminder.completions.map((completion) => ({ reminder, completion })),
    )
    .sort((a, b) => b.completion.doneOn.localeCompare(a.completion.doneOn));
}

/** Active reminders that a scanned document of `category` could fulfil. */
export function activeRemindersOfCategory(
  reminders: Reminder[],
  category: ReminderCategory,
): Reminder[] {
  return reminders.filter(
    (r) => r.status === 'ACTIVE' && r.category === category,
  );
}

/** Whether `documentId` is already linked to the reminder (source or proof). */
export function isDocumentLinked(reminder: Reminder, documentId: string): boolean {
  return (
    reminder.sourceDocumentId === documentId ||
    reminder.completions.some((c) => c.healthDocumentId === documentId)
  );
}
