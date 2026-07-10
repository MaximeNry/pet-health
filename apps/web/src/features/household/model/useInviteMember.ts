'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HouseholdRole } from '@/entities/household';
import { userAdapter } from '@/entities/user/api/userAdapter';
import { householdAdapter } from '../api/householdAdapter';

/** Raised when no PetHealth account matches the invited email address. */
export class UnknownUserError extends Error {
  constructor(email: string) {
    super(`No user found for email ${email}`);
    this.name = 'UnknownUserError';
  }
}

/**
 * "Invites" a member: the API adds members by user id, so the email is first
 * resolved against existing accounts (Google-only signup, no invitation flow
 * in the MVP). Unknown emails raise `UnknownUserError` so the UI can show a
 * dedicated message.
 */
export function useInviteMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: HouseholdRole;
    }) => {
      const users = await userAdapter.list();
      const normalized = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) throw new UnknownUserError(email);
      return householdAdapter.addMember(householdId, user.id, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
