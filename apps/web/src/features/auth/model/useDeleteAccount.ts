'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAdapter } from '../api/authAdapter';
import { sessionQueryKey } from './useSession';

/** Permanently deletes the account, then drops all cached server state. */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAdapter.deleteAccount(),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.clear();
    },
  });
}
