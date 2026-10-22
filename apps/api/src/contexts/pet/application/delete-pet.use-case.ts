import { Inject, Injectable } from '@nestjs/common';
import { PetNotFoundError } from '../domain/pet.errors';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';
import { PetTeardownService } from './pet-teardown.service';

/**
 * Deletes a pet after ensuring it exists. Cascades to its documents and
 * reminders via the shared teardown orchestration (the scanned files stay in
 * the members' Drives).
 */
@Injectable()
export class DeletePetUseCase {
  constructor(
    @Inject(PET_REPOSITORY) private readonly pets: PetRepository,
    private readonly teardown: PetTeardownService,
  ) {}

  async execute(id: string): Promise<void> {
    const pet = await this.pets.findById(id);
    if (pet === null) {
      throw new PetNotFoundError(id);
    }
    await this.teardown.execute(id);
  }
}
