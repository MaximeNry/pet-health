'use client';

import { useQuery } from '@tanstack/react-query';
import { invitationsAdapter } from '../api/invitationsAdapter';

export const invitationsQueryKey = (householdId: string) =>
  ['invitations', householdId] as const;

/** Every invitation of the household (pending, accepted, revoked). */
export function useInvitations(householdId: string) {
  return useQuery({
    queryKey: invitationsQueryKey(householdId),
    queryFn: () => invitationsAdapter.listByHousehold(householdId),
  });
}
