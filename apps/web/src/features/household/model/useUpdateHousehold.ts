'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateHouseholdInput } from '../api/householdAdapter';
import { householdAdapter } from '../api/householdAdapter';

/**
 * Updates a household (name, document types), then refreshes every cached
 * household list. Invalidation is by prefix because the mutation does not
 * know which user's list the household appears in.
 */
export function useUpdateHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHouseholdInput) =>
      householdAdapter.update(householdId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
