import { Inject, Injectable } from '@nestjs/common';
import { Pet } from '../domain/pet.entity';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

export interface CreatePetCommand {
  name: string;
  species: string;
  birthDate: Date;
  householdId: string;
}

/** Creates a pet and persists it. Invariants are carried by the entity. */
@Injectable()
export class CreatePetUseCase {
  constructor(@Inject(PET_REPOSITORY) private readonly pets: PetRepository) {}

  async execute(command: CreatePetCommand): Promise<Pet> {
    const pet = Pet.create(command);
    await this.pets.save(pet);
    return pet;
  }
}
