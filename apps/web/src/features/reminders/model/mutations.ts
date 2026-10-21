'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Reminder } from '@/entities/reminder';
import {
  remindersAdapter,
  type CompleteReminderInput,
  type CreateReminderInput,
  type UpdateReminderInput,
} from '../api/remindersAdapter';
import { reminderKeys } from './queries';

/**
 * Shared success handler: put the fresh reminder in its detail cache, then
 * refresh every list (see `reminderKeys`).
 */
function useOnReminderChanged() {
  const queryClient = useQueryClient();
  return (reminder: Reminder) => {
    queryClient.setQueryData(
      reminderKeys.detail(reminder.petId, reminder.id),
      reminder,
    );
    void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
  };
}

export function useCreateReminder() {
  const onChanged = useOnReminderChanged();
  return useMutation({
    mutationFn: ({ petId, input }: { petId: string; input: CreateReminderInput }) =>
      remindersAdapter.create(petId, input),
    onSuccess: onChanged,
  });
}

export function useUpdateReminder(petId: string, reminderId: string) {
  const onChanged = useOnReminderChanged();
  return useMutation({
    mutationFn: (input: UpdateReminderInput) =>
      remindersAdapter.update(petId, reminderId, input),
    onSuccess: onChanged,
  });
}

/** Marks a reminder as done; takes the pet/reminder ids per call (rows). */
export function useCompleteReminder() {
  const onChanged = useOnReminderChanged();
  return useMutation({
    mutationFn: ({
      petId,
      reminderId,
      input,
    }: {
      petId: string;
      reminderId: string;
      input: CompleteReminderInput;
    }) => remindersAdapter.complete(petId, reminderId, input),
    onSuccess: onChanged,
  });
}

export function useAttachProof(petId: string, reminderId: string) {
  const onChanged = useOnReminderChanged();
  return useMutation({
    mutationFn: ({
      completionId,
      healthDocumentId,
    }: {
      completionId: string;
      healthDocumentId: string | null;
    }) =>
      remindersAdapter.attachProof(
        petId,
        reminderId,
        completionId,
        healthDocumentId,
      ),
    onSuccess: onChanged,
  });
}

export function useArchiveReminder(petId: string, reminderId: string) {
  const onChanged = useOnReminderChanged();
  return useMutation({
    mutationFn: () => remindersAdapter.archive(petId, reminderId),
    onSuccess: onChanged,
  });
}

export function useDeleteReminder(petId: string, reminderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => remindersAdapter.remove(petId, reminderId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: reminderKeys.detail(petId, reminderId),
      });
      void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}
