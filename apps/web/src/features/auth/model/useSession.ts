'use client';

import { useQuery } from '@tanstack/react-query';
import { authAdapter } from '../api/authAdapter';

export const sessionQueryKey = ['session'] as const;

/**
 * Server state for the current session. `data` is `null` when unauthenticated
 * (not an error), so consumers can redirect on `data === null`.
 */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => authAdapter.getMe(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
