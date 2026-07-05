import { Inject, Injectable } from '@nestjs/common';
import { Household } from '../domain/household.entity';
import { HouseholdNotFoundError } from '../domain/household.errors';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

export interface UpdateHouseholdCommand {
  id: string;
  name?: string;
  documentTypes?: string[];
}

/**
 * Loads a household, applies the requested changes (name and/or document
 * types) through the aggregate, then persists.
 */
@Injectable()
export class UpdateHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async execute(command: UpdateHouseholdCommand): Promise<Household> {
    const household = await this.households.findById(command.id);
    if (household === null) {
      throw new HouseholdNotFoundError(command.id);
    }
    if (command.name !== undefined) {
      household.rename(command.name);
    }
    if (command.documentTypes !== undefined) {
      household.updateDocumentTypes(command.documentTypes);
    }
    await this.households.save(household);
    return household;
  }
}
