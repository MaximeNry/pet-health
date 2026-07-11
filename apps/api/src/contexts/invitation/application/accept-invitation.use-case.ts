import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../../household/domain/household.entity';
import {
  HOUSEHOLD_REPOSITORY,
  type HouseholdRepository,
} from '../../household/domain/household.repository';
import { InvitationNotFoundError } from '../domain/invitation.errors';
import {
  INVITATION_REPOSITORY,
  type InvitationRepository,
} from '../domain/invitation.repository';
import {
  INVITATION_TOKEN_SERVICE,
  type InvitationTokenService,
} from '../domain/invitation-token.port';

export interface AcceptInvitationCommand {
  /** Raw token from the invitation link. */
  token: string;
  /** Authenticated user redeeming the link. */
  userId: string;
  /** OAuth-verified email of that user — the authorization credential. */
  verifiedEmail: string;
}

/**
 * Redeems an invitation link. This is the ONE flow that crosses from the
 * invitation context into the household context (reading the household to
 * return it, and enrolling the member through
 * `saveAcceptedWithMembership`) — every other interaction goes by id.
 *
 * Idempotency: a user who is already a member of the household still redeems
 * successfully (the membership insert is a no-op) and gets the household back.
 */
@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitations: InvitationRepository,
    @Inject(INVITATION_TOKEN_SERVICE)
    private readonly tokens: InvitationTokenService,
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<Household> {
    const invitation = await this.invitations.findByTokenHash(
      this.tokens.hash(command.token),
    );
    if (invitation === null) {
      throw new InvitationNotFoundError();
    }

    // An invitation whose household vanished is as good as not found.
    const household = await this.households.findById(invitation.householdId);
    if (household === null) {
      throw new InvitationNotFoundError();
    }

    // Throws in contract order: not pending → 409, expired → 410,
    // email mismatch → 403.
    invitation.accept(command.verifiedEmail, command.userId);

    await this.invitations.saveAcceptedWithMembership(invitation);

    // Reload so the returned aggregate includes the new member.
    return (
      (await this.households.findById(invitation.householdId)) ?? household
    );
  }
}
