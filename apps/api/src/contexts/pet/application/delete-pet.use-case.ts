import { Inject, Injectable } from '@nestjs/common';
import { PetNotFoundError } from '../domain/pet.errors';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

/** Deletes a pet after ensuring it exists. */
@Injectable()
export class DeletePetUseCase {
  constructor(@Inject(PET_REPOSITORY) private readonly pets: PetRepository) {}

  async execute(id: string): Promise<void> {
    const pet = await this.pets.findById(id);
    if (pet === null) {
      throw new PetNotFoundError(id);
    }
    await this.pets.delete(id);
  }
}
