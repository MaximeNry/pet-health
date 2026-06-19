import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface RenameHouseholdCommand {
  id: string;
  name: string;
}

/** Loads a household, renames it through the aggregate, then persists. */
@Injectable()
export class RenameHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: RenameHouseholdCommand): Promise<Household> {
    const household = await this.households.findById(command.id);
    if (household === null) {
      throw new HouseholdNotFoundError(command.id);
    }
    household.rename(command.name);
    await this.households.save(household);
    return household;
  }
}
