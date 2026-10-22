'use client';

import type { Pet } from '@/entities/pet';
import { useHouseholdReminders } from '../model/queries';
import { ReminderBoard } from './ReminderBoard';

/** Every reminder of the household (the reminders page). */
export function HouseholdReminders({
  householdId,
  pets,
}: {
  householdId: string;
  pets: Pet[];
}) {
  const reminders = useHouseholdReminders(householdId);
  return (
    <ReminderBoard
      reminders={reminders.data ?? []}
      pets={pets}
      isLoading={reminders.isLoading}
    />
  );
}
