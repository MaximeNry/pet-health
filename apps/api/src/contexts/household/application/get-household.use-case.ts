import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

@Injectable()
export class GetHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(id: string): Promise<Household> {
    const household = await this.households.findById(id);
    if (household === null) {
      throw new HouseholdNotFoundError(id);
    }
    return household;
  }
}
