import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Household } from '../contexts/household/domain/household.entity';
import { HOUSEHOLD_REPOSITORY } from '../contexts/household/domain/household.repository';
import type { HouseholdRepository } from '../contexts/household/domain/household.repository';
import { INVITATION_REPOSITORY } from '../contexts/invitation/domain/invitation.repository';
import type { InvitationRepository } from '../contexts/invitation/domain/invitation.repository';
import { PET_REPOSITORY } from '../contexts/pet/domain/pet.repository';
import type { PetRepository } from '../contexts/pet/domain/pet.repository';
import type { HouseholdScopeDescriptor } from './household-scope.decorator';

/**
 * Resolves the household a request targets and answers membership questions.
 * This is a sanctioned cross-context reader (household + pet + invitation
 * repositories), used only for access control — it never mutates anything and
 * references the other contexts solely by id, per the architecture rules.
 */
@Injectable()
export class HouseholdMembershipService {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(PET_REPOSITORY)
    private readonly pets: PetRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitations: InvitationRepository,
  ) {}

  /**
   * The household a scoped request targets, or `null` when the anchoring
   * resource (household, pet or invitation) does not exist — the guard then
   * defers to the downstream use case so a missing resource still yields its
   * natural 404/400 rather than a misleading 403.
   */
  async resolveHousehold(
    descriptor: HouseholdScopeDescriptor,
    req: Request,
  ): Promise<Household | null> {
    const value = this.extract(descriptor, req);
    if (!value) {
      return null;
    }

    switch (descriptor.type) {
      case 'householdId':
        return this.households.findById(value);
      case 'pet': {
        const pet = await this.pets.findById(value);
        return pet ? this.households.findById(pet.householdId) : null;
      }
      case 'invitation': {
        const invitation = await this.invitations.findById(value);
        return invitation
          ? this.households.findById(invitation.householdId)
          : null;
      }
    }
  }

  private extract(
    descriptor: HouseholdScopeDescriptor,
    req: Request,
  ): string | undefined {
    const bag =
      descriptor.location === 'param'
        ? req.params
        : descriptor.location === 'query'
          ? req.query
          : (req.body as Record<string, unknown> | undefined);
    const raw = bag?.[descriptor.key];
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }
}
