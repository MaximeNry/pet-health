'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsAdapter } from '../api/invitationsAdapter';
import { invitationsQueryKey } from './useInvitations';

/** Withdraws a pending invitation, then refreshes the household's list. */
export function useRevokeInvitation(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitationsAdapter.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invitationsQueryKey(householdId),
      });
    },
  });
}
