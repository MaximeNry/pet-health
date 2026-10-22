import { CalendarDate } from '../domain/calendar-date.vo';
import type { HealthDocumentDirectory } from '../domain/health-document-directory.port';
import type { PetDirectory } from '../domain/pet-directory.port';
import {
  ReminderDocumentNotFoundError,
  ReminderPetNotFoundError,
} from '../domain/reminder.errors';
import type { ReminderRepository } from '../domain/reminder.repository';
import { CreateReminderUseCase } from './create-reminder.use-case';

const TODAY = CalendarDate.parse('2026-10-21');

describe('CreateReminderUseCase', () => {
  let reminders: jest.Mocked<ReminderRepository>;
  let pets: jest.Mocked<PetDirectory>;
  let documents: jest.Mocked<HealthDocumentDirectory>;
  let useCase: CreateReminderUseCase;

  const command = {
    petId: 'pet-1',
    userId: 'user-1',
    title: 'Rabies booster',
    category: 'VACCINE',
    dueDate: '2027-10-20',
    recurrence: { every: 1, unit: 'YEAR' as const },
    today: TODAY,
  };

  beforeEach(() => {
    reminders = {
      save: jest.fn(),
    } as unknown as jest.Mocked<ReminderRepository>;
    pets = {
      findHouseholdIdOfPet: jest.fn().mockResolvedValue('household-of-pet'),
    };
    documents = { findPetIdOfDocument: jest.fn().mockResolvedValue('pet-1') };
    useCase = new CreateReminderUseCase(reminders, pets, documents);
  });

  it("files the reminder under the pet's household, not a client-provided one", async () => {
    const reminder = await useCase.execute(command);

    expect(reminder.householdId).toBe('household-of-pet');
    expect(reminder.createdBy).toBe('user-1');
    expect(reminder.dueDate.toString()).toBe('2027-10-20');
    expect(reminders.save).toHaveBeenCalledWith(reminder);
  });

  it('creates a reminder from a scanned vaccination: first dose recorded, next one derived', async () => {
    const reminder = await useCase.execute({
      ...command,
      dueDate: undefined,
      healthDocumentId: 'doc-rabies-2025',
      lastDoneOn: '2025-10-23',
    });

    expect(reminder.dueDate.toString()).toBe('2026-10-23');
    expect(reminder.sourceDocumentId).toBe('doc-rabies-2025');
    expect(reminder.basedOnDocumentId).toBe('doc-rabies-2025');
    expect(reminder.completions).toHaveLength(1);
    expect(reminder.completions[0].healthDocumentId).toBe('doc-rabies-2025');
    expect(reminder.completions[0].dueOn).toBeNull();
  });

  it("rejects another pet's document", async () => {
    documents.findPetIdOfDocument.mockResolvedValue('other-pet');

    await expect(
      useCase.execute({ ...command, healthDocumentId: 'doc-x' }),
    ).rejects.toBeInstanceOf(ReminderDocumentNotFoundError);
    expect(reminders.save).not.toHaveBeenCalled();
  });

  it('rejects an unknown pet', async () => {
    pets.findHouseholdIdOfPet.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ReminderPetNotFoundError,
    );
    expect(reminders.save).not.toHaveBeenCalled();
  });
});
