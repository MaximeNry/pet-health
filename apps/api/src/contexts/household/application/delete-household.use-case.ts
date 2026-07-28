import { Inject, Injectable } from '@nestjs/common';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';
import { HouseholdTeardownService } from './household-teardown.service';

/**
 * Deletes a household after ensuring it exists. Deleting the foyer cascades to
 * everything it owns — pets, their documents and stored files — via the shared
 * teardown orchestration, so no orphaned rows or files are left behind.
 */
@Injectable()
export class DeleteHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    private readonly teardown: HouseholdTeardownService,
  ) {}

  async execute(id: string): Promise<void> {
    const household = await this.households.findById(id);
    if (household === null) {
      throw new HouseholdNotFoundError(id);
    }
    await this.teardown.execute(id);
  }
}
