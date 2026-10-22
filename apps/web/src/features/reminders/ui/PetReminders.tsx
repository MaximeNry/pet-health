'use client';

import type { Pet } from '@/entities/pet';
import { usePetReminders } from '../model/queries';
import { ReminderBoard } from './ReminderBoard';

/** A pet's own reminders (the Reminders tab of its detail page). */
export function PetReminders({ pet }: { pet: Pet }) {
  const reminders = usePetReminders(pet.id);
  return (
    <div role="tabpanel" className="pt-5">
      <ReminderBoard
        reminders={reminders.data ?? []}
        pets={[pet]}
        isLoading={reminders.isLoading}
      />
    </div>
  );
}
