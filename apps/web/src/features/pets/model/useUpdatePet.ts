'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePetInput } from '../api/petsAdapter';
import { petsAdapter } from '../api/petsAdapter';
import { petsQueryKey } from './usePets';

/** Updates a pet, then refreshes its household's pet list. */
export function useUpdatePet(petId: string, householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePetInput) => petsAdapter.update(petId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petsQueryKey(householdId) });
    },
  });
}
