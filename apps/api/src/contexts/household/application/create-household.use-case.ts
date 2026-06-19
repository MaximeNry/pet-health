import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface CreateHouseholdCommand {
  name: string;
  ownerId: string;
}

/** Creates a household with its founding owner, then persists it. */
@Injectable()
export class CreateHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: CreateHouseholdCommand): Promise<Household> {
    const household = Household.create({
      name: command.name,
      ownerId: command.ownerId,
    });
    await this.households.save(household);
    return household;
  }
}
