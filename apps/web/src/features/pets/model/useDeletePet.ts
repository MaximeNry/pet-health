'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { petsAdapter } from '../api/petsAdapter';
import { petQueryKey } from './usePet';
import { petsQueryKey } from './usePets';

/** Deletes a pet, drops its detail query and refreshes the household list. */
export function useDeletePet(petId: string, householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => petsAdapter.remove(petId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: petQueryKey(petId) });
      queryClient.invalidateQueries({ queryKey: petsQueryKey(householdId) });
    },
  });
}
