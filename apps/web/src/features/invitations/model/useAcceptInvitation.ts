'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsAdapter } from '../api/invitationsAdapter';

/**
 * Redeems an invitation link for the signed-in user. On success the household
 * cache is cleared so the dashboard picks up the new membership.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationsAdapter.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
