import type { PetDirectory } from '../domain/pet-directory.port';
import { ReminderPetNotFoundError } from '../domain/reminder.errors';
import type { ReminderRepository } from '../domain/reminder.repository';
import { CreateReminderUseCase } from './create-reminder.use-case';

describe('CreateReminderUseCase', () => {
  let reminders: jest.Mocked<ReminderRepository>;
  let pets: jest.Mocked<PetDirectory>;
  let useCase: CreateReminderUseCase;

  const command = {
    petId: 'pet-1',
    userId: 'user-1',
    title: 'Rabies booster',
    category: 'VACCINE',
    dueDate: '2027-10-20',
    recurrence: { every: 1, unit: 'YEAR' as const },
  };

  beforeEach(() => {
    reminders = {
      save: jest.fn(),
    } as unknown as jest.Mocked<ReminderRepository>;
    pets = { findHouseholdIdOfPet: jest.fn() };
    useCase = new CreateReminderUseCase(reminders, pets);
  });

  it("files the reminder under the pet's household, not a client-provided one", async () => {
    pets.findHouseholdIdOfPet.mockResolvedValue('household-of-pet');

    const reminder = await useCase.execute(command);

    expect(reminder.householdId).toBe('household-of-pet');
    expect(reminder.createdBy).toBe('user-1');
    expect(reminder.dueDate.toString()).toBe('2027-10-20');
    expect(reminders.save).toHaveBeenCalledWith(reminder);
  });

  it('rejects an unknown pet', async () => {
    pets.findHouseholdIdOfPet.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ReminderPetNotFoundError,
    );
    expect(reminders.save).not.toHaveBeenCalled();
  });
});
