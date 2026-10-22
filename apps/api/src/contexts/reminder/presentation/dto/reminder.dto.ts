import type { RecurrenceProps } from '../../domain/recurrence.vo';

/** JSON body of `POST /pets/:petId/reminders`. Days are `YYYY-MM-DD`. */
export interface CreateReminderDto {
  title: string;
  category: string;
  /** Optional when `lastDoneOn` is given (derived from it). */
  dueDate?: string;
  /** Omitted or null for a one-off reminder. */
  recurrence?: RecurrenceProps | null;
  /** The record the reminder is created from (one of the pet's documents). */
  healthDocumentId?: string | null;
  /** The care was already given that day: recorded as the first completion. */
  lastDoneOn?: string;
}

/** JSON body of `PATCH …/:reminderId`: omitted = untouched. */
export interface UpdateReminderDto {
  title?: string;
  category?: string;
  /** `null` turns the reminder into a one-off one. */
  recurrence?: RecurrenceProps | null;
  dueDate?: string;
}

/** JSON body of `POST …/:reminderId/complete`. */
export interface CompleteReminderDto {
  /** Defaults to the caller's today. */
  doneOn?: string;
  /** The scanned proof (e.g. the vaccination certificate), if any. */
  healthDocumentId?: string | null;
}

/** JSON body of `PATCH …/:reminderId/completions/:completionId`. */
export interface UpdateCompletionDto {
  /** The proof to attach; `null` detaches it. */
  healthDocumentId: string | null;
}
