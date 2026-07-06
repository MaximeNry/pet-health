import { Inject, Injectable } from '@nestjs/common';
import { Pet } from '../domain/pet.entity';
import { PetNotFoundError } from '../domain/pet.errors';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

export interface UpdatePetCommand {
  id: string;
  name?: string;
  species?: string;
  birthDate?: Date;
  breed?: string | null;
  sex?: string | null;
  weightKg?: number | null;
}

/** Loads a pet, applies the changes through the entity, then persists. */
@Injectable()
export class UpdatePetUseCase {
  constructor(@Inject(PET_REPOSITORY) private readonly pets: PetRepository) {}

  async execute(command: UpdatePetCommand): Promise<Pet> {
    const pet = await this.pets.findById(command.id);
    if (pet === null) {
      throw new PetNotFoundError(command.id);
    }
    pet.update({
      name: command.name,
      species: command.species,
      birthDate: command.birthDate,
      breed: command.breed,
      sex: command.sex,
      weightKg: command.weightKg,
    });
    await this.pets.save(pet);
    return pet;
  }
}
