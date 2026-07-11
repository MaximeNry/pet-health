import { apiClient } from '@/shared/api/apiClient';
import type { Household } from '@/entities/household';
import type {
  CreatedInvitation,
  CreateInvitationInput,
  Invitation,
} from './types';

/** Centralized access to the invitation endpoints. */
export const invitationsAdapter = {
  create: (input: CreateInvitationInput) =>
    apiClient.post<CreatedInvitation>('/invitations', input),

  /** Redeems a link token for the signed-in user; returns the household. */
  accept: (token: string) =>
    apiClient.post<Household>('/invitations/accept', { token }),

  listByHousehold: (householdId: string) =>
    apiClient.get<Invitation[]>(
      `/invitations?householdId=${encodeURIComponent(householdId)}`,
    ),

  revoke: (id: string) =>
    apiClient.delete<Invitation>(`/invitations/${encodeURIComponent(id)}`),
};
