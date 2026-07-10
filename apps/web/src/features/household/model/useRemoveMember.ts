'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { householdAdapter } from '../api/householdAdapter';

/** Removes a member from the household, then refreshes cached lists. */
export function useRemoveMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      householdAdapter.removeMember(householdId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
