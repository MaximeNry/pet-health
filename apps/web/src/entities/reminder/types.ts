/** Kinds of care, aligned with the API's `ReminderCategory` value object. */
export type ReminderCategory =
  | 'VACCINE'
  | 'ANTIPARASITIC'
  | 'DEWORMING'
  | 'CHECKUP'
  | 'OTHER';

export const REMINDER_CATEGORIES: ReminderCategory[] = [
  'VACCINE',
  'ANTIPARASITIC',
  'DEWORMING',
  'CHECKUP',
  'OTHER',
];

export type RecurrenceUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

/** "Every `every` `unit`s", e.g. every 3 months. */
export interface Recurrence {
  every: number;
  unit: RecurrenceUnit;
}

/** Derived by the API for the caller's day; `null` once archived. */
export type ReminderUrgency = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';

export type ReminderStatus = 'ACTIVE' | 'ARCHIVED';

/** One occurrence of the care being done. Days are `YYYY-MM-DD`. */
export interface ReminderCompletion {
  id: string;
  doneOn: string;
  doneBy: string;
  healthDocumentId: string | null;
  /** The due date it fulfilled; `null` when unknown. */
  dueOn: string | null;
  /** Positive = late, 0 = on the day, negative = early; `null` if unknown. */
  daysLate: number | null;
  createdAt: string;
}

/** A reminder as returned by the API. Days are `YYYY-MM-DD` calendar days. */
export interface Reminder {
  id: string;
  petId: string;
  householdId: string;
  title: string;
  category: ReminderCategory;
  dueDate: string;
  recurrence: Recurrence | null;
  sourceDocumentId: string | null;
  /** What the UI shows as "Based on": latest proof, else the source. */
  basedOnDocumentId: string | null;
  status: ReminderStatus;
  urgency: ReminderUrgency | null;
  /** Negative when overdue, 0 when due today. */
  daysUntilDue: number;
  lastDoneOn: string | null;
  /** Most recent first. */
  completions: ReminderCompletion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
