'use client';

import { useQuery } from '@tanstack/react-query';
import { householdAdapter } from '../api/householdAdapter';

export const householdsQueryKey = (userId: string) =>
  ['households', userId] as const;

/**
 * Households the user belongs to. Disabled until the user id is known. The MVP
 * treats the first household as the active one.
 */
export function useHouseholds(userId: string | undefined) {
  return useQuery({
    queryKey: householdsQueryKey(userId ?? 'none'),
    queryFn: () => householdAdapter.listByUser(userId as string),
    enabled: Boolean(userId),
  });
}
