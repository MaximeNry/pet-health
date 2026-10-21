import type { PetTeardownService } from '../../pet/application/pet-teardown.service';
import { Pet } from '../../pet/domain/pet.entity';
import type { PetRepository } from '../../pet/domain/pet.repository';
import type { HouseholdRepository } from '../domain/household.repository';
import { HouseholdTeardownService } from './household-teardown.service';

const HOUSEHOLD_ID = 'household-1';

const makePet = (name: string) =>
  Pet.create({
    name,
    species: 'CAT',
    birthDate: new Date('2020-01-01'),
    householdId: HOUSEHOLD_ID,
  });

function makeDeps() {
  const households = {
    save: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<HouseholdRepository>;
  const pets = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHouseholdId: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  } as jest.Mocked<PetRepository>;
  const petTeardown = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<PetTeardownService>;
  const service = new HouseholdTeardownService(households, pets, petTeardown);
  return { households, pets, petTeardown, service };
}

describe('HouseholdTeardownService', () => {
  it('tears down every pet, then the household', async () => {
    const { households, pets, petTeardown, service } = makeDeps();
    const nala = makePet('Nala');
    const simba = makePet('Simba');
    pets.findByHouseholdId.mockResolvedValue([nala, simba]);

    await service.execute(HOUSEHOLD_ID);

    expect(petTeardown.execute.mock.calls).toEqual([[nala.id], [simba.id]]);
    expect(households.delete).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });

  it('deletes an empty household directly', async () => {
    const { households, petTeardown, service } = makeDeps();

    await service.execute(HOUSEHOLD_ID);

    expect(petTeardown.execute).not.toHaveBeenCalled();
    expect(households.delete).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });
});
