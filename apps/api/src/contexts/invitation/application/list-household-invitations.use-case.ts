import { Inject, Injectable } from '@nestjs/common';
import { Invitation } from '../domain/invitation.entity';
import {
  INVITATION_REPOSITORY,
  type InvitationRepository,
} from '../domain/invitation.repository';

/** Lists every invitation of a household (pending, accepted and revoked). */
@Injectable()
export class ListHouseholdInvitationsUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(householdId: string): Promise<Invitation[]> {
    return this.invitations.findByHouseholdId(householdId);
  }
}
