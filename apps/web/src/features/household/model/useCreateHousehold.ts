'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { householdAdapter } from '../api/householdAdapter';
import { householdsQueryKey } from './useHouseholds';

/** Creates a household, then refreshes the user's household list. */
export function useCreateHousehold(ownerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => householdAdapter.create(name, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: householdsQueryKey(ownerId),
      });
    },
  });
}
