'use client';

import { useQueries } from '@tanstack/react-query';
import { userAdapter } from '@/entities/user/api/userAdapter';
import type { UserProfile } from '@/entities/user';
import type { HouseholdMember } from '@/entities/household';

/**
 * Resolves each member's profile in parallel and returns them keyed by userId.
 * Individual failures are tolerated (a missing profile falls back to initials
 * from other data at render time).
 */
export function useHouseholdMembers(
  members: HouseholdMember[],
): Record<string, UserProfile> {
  const results = useQueries({
    queries: members.map((member) => ({
      queryKey: ['user', member.userId],
      queryFn: () => userAdapter.getById(member.userId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const byId: Record<string, UserProfile> = {};
  for (const result of results) {
    if (result.data) {
      byId[result.data.id] = result.data;
    }
  }
  return byId;
}
