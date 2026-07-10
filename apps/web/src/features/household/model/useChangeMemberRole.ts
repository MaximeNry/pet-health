'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HouseholdRole } from '@/entities/household';
import { householdAdapter } from '../api/householdAdapter';

/** Changes a member's role, then refreshes every cached household list. */
export function useChangeMemberRole(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: HouseholdRole }) =>
      householdAdapter.changeMemberRole(householdId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
