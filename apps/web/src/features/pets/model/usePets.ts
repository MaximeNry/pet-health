'use client';

import { useQuery } from '@tanstack/react-query';
import { petsAdapter } from '../api/petsAdapter';

export const petsQueryKey = (householdId: string) =>
  ['pets', householdId] as const;

/** Pets belonging to a household. Disabled until a household id is known. */
export function usePets(householdId: string | undefined) {
  return useQuery({
    queryKey: petsQueryKey(householdId ?? 'none'),
    queryFn: () => petsAdapter.listByHousehold(householdId as string),
    enabled: Boolean(householdId),
  });
}
