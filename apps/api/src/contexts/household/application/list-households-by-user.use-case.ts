import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

/** Lists the households a user belongs to. */
@Injectable()
export class ListHouseholdsByUserUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  execute(userId: string): Promise<Household[]> {
    return this.households.findByUserId(userId);
  }
}
