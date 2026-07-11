import { Inject, Injectable } from '@nestjs/common';
import { Invitation } from '../domain/invitation.entity';
import { PendingInvitationAlreadyExistsError } from '../domain/invitation.errors';
import {
  INVITATION_REPOSITORY,
  type InvitationRepository,
} from '../domain/invitation.repository';
import {
  INVITATION_TOKEN_SERVICE,
  type InvitationTokenService,
} from '../domain/invitation-token.port';

export interface CreateInvitationCommand {
  householdId: string;
  invitedEmail: string;
  /** Authenticated user issuing the invitation (audit). */
  invitedBy: string;
  expiresInDays?: number;
}

export interface CreatedInvitation {
  invitation: Invitation;
  /** Raw link token — surfaced once in the response, never persisted. */
  token: string;
}

/**
 * Issues a shareable invitation link. The raw token goes back to the caller
 * (who shares it manually — no email is sent); only its hash is stored.
 */
@Injectable()
export class CreateInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitations: InvitationRepository,
    @Inject(INVITATION_TOKEN_SERVICE)
    private readonly tokens: InvitationTokenService,
  ) {}

  async execute(command: CreateInvitationCommand): Promise<CreatedInvitation> {
    const { token, tokenHash } = this.tokens.generate();
    const invitation = Invitation.create({
      householdId: command.householdId,
      invitedEmail: command.invitedEmail,
      invitedBy: command.invitedBy,
      tokenHash,
      expiresInDays: command.expiresInDays,
    });

    // Pre-check for a friendly error; the partial unique index on
    // (household_id, invited_email) WHERE status = 'PENDING' remains the
    // race-proof guarantee.
    const pending = await this.invitations.findPendingByEmail(
      invitation.householdId,
      invitation.invitedEmail,
    );
    if (pending !== null) {
      throw new PendingInvitationAlreadyExistsError(invitation.invitedEmail);
    }

    await this.invitations.save(invitation);
    return { invitation, token };
  }
}
