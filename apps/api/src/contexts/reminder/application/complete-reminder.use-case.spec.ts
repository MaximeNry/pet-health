import { CalendarDate } from '../domain/calendar-date.vo';
import { Reminder } from '../domain/reminder.entity';
import { ReminderNotFoundError } from '../domain/reminder.errors';
import type { ReminderRepository } from '../domain/reminder.repository';
import { CompleteReminderUseCase } from './complete-reminder.use-case';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

const TODAY = CalendarDate.parse('2026-10-20');

describe('CompleteReminderUseCase', () => {
  let reminders: jest.Mocked<ReminderRepository>;
  let useCase: CompleteReminderUseCase;
  let reminder: Reminder;

  beforeEach(() => {
    reminder = Reminder.create({
      petId: 'pet-1',
      householdId: 'household-1',
      createdBy: 'user-1',
      title: 'Antiparasitic',
      category: 'ANTIPARASITIC',
      dueDate: CalendarDate.parse('2026-10-01'),
      recurrence: { every: 3, unit: 'MONTH' },
    });
    reminders = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(reminder),
    } as unknown as jest.Mocked<ReminderRepository>;
    useCase = new CompleteReminderUseCase(
      reminders,
      new GetPetReminderUseCase(reminders),
    );
  });

  it("defaults the completion day to the caller's today", async () => {
    await useCase.execute({
      petId: 'pet-1',
      reminderId: reminder.id,
      userId: 'user-2',
      today: TODAY,
    });

    expect(reminder.lastDoneOn?.toString()).toBe('2026-10-20');
    expect(reminder.dueDate.toString()).toBe('2027-01-20');
    expect(reminders.save).toHaveBeenCalledWith(reminder);
  });

  it('is a not-found when reached through another pet', async () => {
    await expect(
      useCase.execute({
        petId: 'other-pet',
        reminderId: reminder.id,
        userId: 'user-2',
        today: TODAY,
      }),
    ).rejects.toBeInstanceOf(ReminderNotFoundError);
    expect(reminders.save).not.toHaveBeenCalled();
  });
});
