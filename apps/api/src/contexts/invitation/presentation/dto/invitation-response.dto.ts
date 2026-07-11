import { Invitation } from '../../domain/invitation.entity';

/**
 * HTTP representation of an invitation (dates in ISO 8601). The token hash
 * never leaves the API; the raw token appears only once, in the creation
 * response's `link`.
 */
export interface InvitationResponse {
  id: string;
  householdId: string;
  invitedEmail: string;
  status: string;
  invitedBy: string;
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

/** Creation response: the invitation plus its one-time shareable link. */
export interface CreatedInvitationResponse {
  invitation: InvitationResponse;
  link: string;
}

/** Projects the aggregate into its HTTP representation. */
export function toInvitationResponse(
  invitation: Invitation,
): InvitationResponse {
  return {
    id: invitation.id,
    householdId: invitation.householdId,
    invitedEmail: invitation.invitedEmail,
    status: invitation.status,
    invitedBy: invitation.invitedBy,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedBy: invitation.acceptedBy,
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  };
}
