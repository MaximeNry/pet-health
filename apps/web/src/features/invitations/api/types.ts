/**
 * Decided invitation states, mirroring the API. "Expired" is never a status:
 * it is derived client-side from `expiresAt` on a PENDING invitation.
 */
export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** An invitation as returned by the API (never carries the raw token). */
export interface Invitation {
  id: string;
  householdId: string;
  invitedEmail: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

/** Creation response: the raw token appears once, inside `link`. */
export interface CreatedInvitation {
  invitation: Invitation;
  link: string;
}

export interface CreateInvitationInput {
  householdId: string;
  invitedEmail: string;
  expiresInDays?: number;
}
