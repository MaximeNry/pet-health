import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface RemoveMemberCommand {
  householdId: string;
  userId: string;
}

/** Removes a member from a household through the aggregate, then persists. */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<Household> {
    const household = await this.households.findById(command.householdId);
    if (household === null) {
      throw new HouseholdNotFoundError(command.householdId);
    }
    household.removeMember(command.userId);
    await this.households.save(household);
    return household;
  }
}
