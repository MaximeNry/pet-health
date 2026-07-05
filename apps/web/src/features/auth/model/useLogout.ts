'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAdapter } from '../api/authAdapter';
import { sessionQueryKey } from './useSession';

/** Logs out and clears cached server state so no stale data survives. */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAdapter.logout(),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.clear();
    },
  });
}
