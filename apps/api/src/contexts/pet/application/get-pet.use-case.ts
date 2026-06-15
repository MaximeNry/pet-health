import { Inject, Injectable } from '@nestjs/common';
import { Pet } from '../domain/pet.entity';
import { PetNotFoundError } from '../domain/pet.errors';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

@Injectable()
export class GetPetUseCase {
  constructor(@Inject(PET_REPOSITORY) private readonly pets: PetRepository) {}

  async execute(id: string): Promise<Pet> {
    const pet = await this.pets.findById(id);
    if (pet === null) {
      throw new PetNotFoundError(id);
    }
    return pet;
  }
}
