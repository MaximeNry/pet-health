'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/apiClient';
import { petsAdapter } from '../api/petsAdapter';

export const petQueryKey = (petId: string) => ['pet', petId] as const;

/** A single pet profile, for the detail page. */
export function usePet(petId: string) {
  return useQuery({
    queryKey: petQueryKey(petId),
    queryFn: () => petsAdapter.getById(petId),
    // A 404 is definitive (unknown/deleted pet) — retrying only delays the
    // error state; other failures keep the default backoff.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) &&
      failureCount < 3,
  });
}
