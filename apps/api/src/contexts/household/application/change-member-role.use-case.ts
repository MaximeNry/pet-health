import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdRole } from '../domain/household-role.vo';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface ChangeMemberRoleCommand {
  householdId: string;
  userId: string;
  role: string;
}

/** Changes a member's role through the aggregate, then persists. */
@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<Household> {
    const household = await this.households.findById(command.householdId);
    if (household === null) {
      throw new HouseholdNotFoundError(command.householdId);
    }
    household.changeMemberRole(
      command.userId,
      HouseholdRole.create(command.role),
    );
    await this.households.save(household);
    return household;
  }
}
