'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsAdapter } from '../api/invitationsAdapter';
import { invitationsQueryKey } from './useInvitations';

/**
 * Issues a shareable invitation link for an email. The result carries the
 * link with the raw token — the only time it is ever visible.
 */
export function useCreateInvitation(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { invitedEmail: string; expiresInDays?: number }) =>
      invitationsAdapter.create({ householdId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invitationsQueryKey(householdId),
      });
    },
  });
}
