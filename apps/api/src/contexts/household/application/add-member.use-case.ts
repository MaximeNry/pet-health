import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdRole } from '../domain/household-role.vo';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface AddMemberCommand {
  householdId: string;
  userId: string;
  role?: string;
}

/** Adds a member to a household through the aggregate, then persists. */
@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: AddMemberCommand): Promise<Household> {
    const household = await this.households.findById(command.householdId);
    if (household === null) {
      throw new HouseholdNotFoundError(command.householdId);
    }
    const role =
      command.role !== undefined
        ? HouseholdRole.create(command.role)
        : undefined;
    household.addMember(command.userId, role);
    await this.households.save(household);
    return household;
  }
}
