import { Inject, Injectable } from '@nestjs/common';
import { PetTeardownService } from '../../pet/application/pet-teardown.service';
import {
  PET_REPOSITORY,
  type PetRepository,
} from '../../pet/domain/pet.repository';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

/**
 * Tears down a household and everything that would become orphaned with it.
 * Like the invitation accept flow and the account-deletion flow, this is a
 * sanctioned cross-context orchestration — it only talks to the other contexts
 * through their ports and teardown services, never by importing their entities.
 *
 * Order matters: each pet first (via `PetTeardownService`: its documents, its
 * reminders, then the pet), then the household root. The household's
 * invitations cascade in the database. The scanned files stay in the
 * members' Drives. Shared by `DeleteHouseholdUseCase` (owner deletes the
 * household) and `DeleteAccountUseCase` (last member deletes their account).
 */
@Injectable()
export class HouseholdTeardownService {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(PET_REPOSITORY) private readonly pets: PetRepository,
    private readonly petTeardown: PetTeardownService,
  ) {}

  async execute(householdId: string): Promise<void> {
    for (const pet of await this.pets.findByHouseholdId(householdId)) {
      await this.petTeardown.execute(pet.id);
    }
    await this.households.delete(householdId);
  }
}
