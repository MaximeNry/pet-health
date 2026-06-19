import { Inject, Injectable } from '@nestjs/common';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

/** Deletes a household (and its members) after ensuring it exists. */
@Injectable()
export class DeleteHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const household = await this.households.findById(id);
    if (household === null) {
      throw new HouseholdNotFoundError(id);
    }
    await this.households.delete(id);
  }
}
