'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Reminder } from '@/entities/reminder';
import { remindersAdapter } from '../api/remindersAdapter';

/**
 * Every reminder query key starts with `'reminders'`: a mutation invalidates
 * the whole family at once, since one completion moves a reminder in the
 * pet list, the household list, the dashboard card and its own detail.
 */
export const reminderKeys = {
  all: ['reminders'] as const,
  household: (householdId: string) =>
    ['reminders', 'household', householdId] as const,
  upcoming: (householdId: string) =>
    ['reminders', 'upcoming', householdId] as const,
  pet: (petId: string) => ['reminders', 'pet', petId] as const,
  detail: (petId: string, reminderId: string) =>
    ['reminders', 'detail', petId, reminderId] as const,
};

/** Every reminder of the household, active and archived (reminders page). */
export function useHouseholdReminders(householdId: string | undefined) {
  return useQuery({
    queryKey: reminderKeys.household(householdId ?? ''),
    queryFn: () => remindersAdapter.listByHousehold(householdId!),
    enabled: !!householdId,
  });
}

/** Overdue and next-30-days reminders of the household (dashboard card). */
export function useUpcomingReminders(householdId: string | undefined) {
  return useQuery({
    queryKey: reminderKeys.upcoming(householdId ?? ''),
    queryFn: () => remindersAdapter.listUpcoming(householdId!),
    enabled: !!householdId,
  });
}

/** Every reminder of a pet, active and archived. */
export function usePetReminders(petId: string) {
  return useQuery({
    queryKey: reminderKeys.pet(petId),
    queryFn: () => remindersAdapter.listByPet(petId),
  });
}

/** One reminder; seeds from the pet's list when it is already cached. */
export function usePetReminder(petId: string, reminderId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: reminderKeys.detail(petId, reminderId),
    queryFn: () => remindersAdapter.getById(petId, reminderId),
    initialData: () =>
      queryClient
        .getQueryData<Reminder[]>(reminderKeys.pet(petId))
        ?.find((reminder) => reminder.id === reminderId),
  });
}
