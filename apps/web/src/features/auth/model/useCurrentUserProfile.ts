'use client';

import { useQuery } from '@tanstack/react-query';
import { userAdapter } from '@/entities/user/api/userAdapter';

/** The current user's full profile (for display name / initials). */
export function useCurrentUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userAdapter.getById(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}
