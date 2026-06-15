import { Inject, Injectable } from '@nestjs/common';
import { Pet } from '../domain/pet.entity';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

/** Lists the pets attached to a household. */
@Injectable()
export class ListPetsByHouseholdUseCase {
  constructor(@Inject(PET_REPOSITORY) private readonly pets: PetRepository) {}

  execute(householdId: string): Promise<Pet[]> {
    return this.pets.findByHouseholdId(householdId);
  }
}
