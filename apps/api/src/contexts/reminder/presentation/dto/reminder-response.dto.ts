import type { CalendarDate } from '../../domain/calendar-date.vo';
import type { RecurrenceProps } from '../../domain/recurrence.vo';
import type {
  Reminder,
  ReminderStatus,
  ReminderUrgency,
} from '../../domain/reminder.entity';

export interface ReminderCompletionResponse {
  id: string;
  /** `YYYY-MM-DD`. */
  doneOn: string;
  doneBy: string;
  healthDocumentId: string | null;
  /** The due date it fulfilled (`YYYY-MM-DD`), `null` when unknown. */
  dueOn: string | null;
  /** Positive = late, 0 = on the day, negative = early, `null` if unknown. */
  daysLate: number | null;
  createdAt: string;
}

/**
 * Reminder as exposed over HTTP. Days are `YYYY-MM-DD` strings (calendar
 * days, never shifted by a time zone); `urgency` and `daysUntilDue` are
 * derived for the caller's today and never stored.
 */
export interface ReminderResponse {
  id: string;
  petId: string;
  householdId: string;
  title: string;
  category: string;
  dueDate: string;
  recurrence: RecurrenceProps | null;
  /** The record it was created from, if any. */
  sourceDocumentId: string | null;
  /** What the UI shows as "Based on": latest proof, else the source. */
  basedOnDocumentId: string | null;
  status: ReminderStatus;
  /** `null` once archived. */
  urgency: ReminderUrgency | null;
  /** Negative when overdue, 0 when due today. */
  daysUntilDue: number;
  lastDoneOn: string | null;
  /** Most recent first. */
  completions: ReminderCompletionResponse[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toReminderResponse(
  reminder: Reminder,
  today: CalendarDate,
): ReminderResponse {
  return {
    id: reminder.id,
    petId: reminder.petId,
    householdId: reminder.householdId,
    title: reminder.title,
    category: reminder.category,
    dueDate: reminder.dueDate.toString(),
    recurrence: reminder.recurrence?.toProps() ?? null,
    sourceDocumentId: reminder.sourceDocumentId,
    basedOnDocumentId: reminder.basedOnDocumentId,
    status: reminder.status,
    urgency: reminder.urgency(today),
    daysUntilDue: reminder.daysUntilDue(today),
    lastDoneOn: reminder.lastDoneOn?.toString() ?? null,
    completions: reminder.completions.map((completion) => ({
      id: completion.id,
      doneOn: completion.doneOn.toString(),
      doneBy: completion.doneBy,
      healthDocumentId: completion.healthDocumentId,
      dueOn: completion.dueOn?.toString() ?? null,
      daysLate: completion.daysLate,
      createdAt: completion.createdAt.toISOString(),
    })),
    createdBy: reminder.createdBy,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}
