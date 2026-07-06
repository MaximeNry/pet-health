'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePetInput } from '../api/petsAdapter';
import { petsAdapter } from '../api/petsAdapter';
import { petsQueryKey } from './usePets';

/** Creates a pet, then refreshes the household's pet list. */
export function useCreatePet(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreatePetInput, 'householdId'>) =>
      petsAdapter.create({ ...input, householdId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petsQueryKey(householdId) });
    },
  });
}
