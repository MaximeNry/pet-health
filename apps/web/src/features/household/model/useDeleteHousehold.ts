'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { householdAdapter } from '../api/householdAdapter';

/**
 * Deletes a household. The API cascades the teardown (pets, documents and
 * their stored files), so we drop the household lists and the pet list for
 * this household from the cache; the dashboard then falls back to the
 * "create a household" screen.
 */
export function useDeleteHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => householdAdapter.remove(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.removeQueries({ queryKey: ['pets', householdId] });
    },
  });
}
