import { Inject, Injectable } from '@nestjs/common';
import { Invitation } from '../domain/invitation.entity';
import { InvitationNotFoundError } from '../domain/invitation.errors';
import {
  INVITATION_REPOSITORY,
  type InvitationRepository,
} from '../domain/invitation.repository';

/** Withdraws a pending invitation through the aggregate, then persists. */
@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(id: string): Promise<Invitation> {
    const invitation = await this.invitations.findById(id);
    if (invitation === null) {
      throw new InvitationNotFoundError();
    }
    invitation.revoke();
    await this.invitations.save(invitation);
    return invitation;
  }
}
