import { apiClient } from '@/shared/api/apiClient';
import type { Recurrence, Reminder, ReminderCategory } from '@/entities/reminder';
import { localToday } from '@/entities/reminder';

/** Body of `POST /pets/:petId/reminders`. Days are `YYYY-MM-DD`. */
export interface CreateReminderInput {
  title: string;
  category: ReminderCategory;
  /** Optional when `lastDoneOn` is given (the API derives it). */
  dueDate?: string;
  recurrence: Recurrence | null;
  /** The record the reminder is created from. */
  healthDocumentId?: string | null;
  /** The care was already given that day (first completion). */
  lastDoneOn?: string;
}

/** Body of `PATCH …/:reminderId`: omitted = untouched. */
export interface UpdateReminderInput {
  title?: string;
  category?: ReminderCategory;
  recurrence?: Recurrence | null;
  dueDate?: string;
}

export interface CompleteReminderInput {
  /** Defaults to today on the API side. */
  doneOn?: string;
  healthDocumentId?: string | null;
}

const enc = encodeURIComponent;
const petBase = (petId: string) => `/pets/${enc(petId)}/reminders`;
const one = (petId: string, reminderId: string) =>
  `${petBase(petId)}/${enc(reminderId)}`;

/**
 * Every call carries the user's local day (`?today=`) so urgency and "done
 * today" follow the user's clock rather than the server's UTC day.
 */
const withToday = (path: string) =>
  `${path}${path.includes('?') ? '&' : '?'}today=${localToday()}`;

/** Centralised access to the reminder endpoints. */
export const remindersAdapter = {
  listByHousehold: (householdId: string) =>
    apiClient.get<Reminder[]>(
      withToday(`/households/${enc(householdId)}/reminders`),
    ),

  listUpcoming: (householdId: string, days = 30) =>
    apiClient.get<Reminder[]>(
      withToday(`/households/${enc(householdId)}/reminders/upcoming?days=${days}`),
    ),

  listByPet: (petId: string) =>
    apiClient.get<Reminder[]>(withToday(petBase(petId))),

  getById: (petId: string, reminderId: string) =>
    apiClient.get<Reminder>(withToday(one(petId, reminderId))),

  create: (petId: string, input: CreateReminderInput) =>
    apiClient.post<Reminder>(withToday(petBase(petId)), input),

  update: (petId: string, reminderId: string, input: UpdateReminderInput) =>
    apiClient.patch<Reminder>(withToday(one(petId, reminderId)), input),

  complete: (petId: string, reminderId: string, input: CompleteReminderInput) =>
    apiClient.post<Reminder>(
      withToday(`${one(petId, reminderId)}/complete`),
      input,
    ),

  attachProof: (
    petId: string,
    reminderId: string,
    completionId: string,
    healthDocumentId: string | null,
  ) =>
    apiClient.patch<Reminder>(
      withToday(`${one(petId, reminderId)}/completions/${enc(completionId)}`),
      { healthDocumentId },
    ),

  archive: (petId: string, reminderId: string) =>
    apiClient.post<Reminder>(withToday(`${one(petId, reminderId)}/archive`)),

  remove: (petId: string, reminderId: string) =>
    apiClient.delete<void>(one(petId, reminderId)),
};
