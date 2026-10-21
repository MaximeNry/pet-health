import { CalendarDate } from '../domain/calendar-date.vo';
import type { HealthDocumentDirectory } from '../domain/health-document-directory.port';
import { Reminder } from '../domain/reminder.entity';
import { ReminderDocumentNotFoundError } from '../domain/reminder.errors';
import type { ReminderRepository } from '../domain/reminder.repository';
import { AttachCompletionProofUseCase } from './attach-completion-proof.use-case';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

describe('AttachCompletionProofUseCase', () => {
  let reminders: jest.Mocked<ReminderRepository>;
  let documents: jest.Mocked<HealthDocumentDirectory>;
  let useCase: AttachCompletionProofUseCase;
  let reminder: Reminder;
  let completionId: string;

  beforeEach(() => {
    reminder = Reminder.create({
      petId: 'pet-1',
      householdId: 'household-1',
      createdBy: 'user-1',
      title: 'Deworming',
      category: 'DEWORMING',
      dueDate: CalendarDate.parse('2026-10-18'),
      recurrence: { every: 3, unit: 'MONTH' },
    });
    completionId = reminder.complete(
      { doneOn: CalendarDate.parse('2026-10-21'), doneBy: 'user-1' },
      CalendarDate.parse('2026-10-21'),
    ).id;
    reminders = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(reminder),
    } as unknown as jest.Mocked<ReminderRepository>;
    documents = { findPetIdOfDocument: jest.fn().mockResolvedValue('pet-1') };
    useCase = new AttachCompletionProofUseCase(
      reminders,
      documents,
      new GetPetReminderUseCase(reminders),
    );
  });

  it('attaches a document of the same pet', async () => {
    await useCase.execute({
      petId: 'pet-1',
      reminderId: reminder.id,
      completionId,
      healthDocumentId: 'receipt-1',
    });

    expect(reminder.completions[0].healthDocumentId).toBe('receipt-1');
    expect(reminders.save).toHaveBeenCalledWith(reminder);
  });

  it("rejects another pet's document", async () => {
    documents.findPetIdOfDocument.mockResolvedValue('other-pet');

    await expect(
      useCase.execute({
        petId: 'pet-1',
        reminderId: reminder.id,
        completionId,
        healthDocumentId: 'doc-x',
      }),
    ).rejects.toBeInstanceOf(ReminderDocumentNotFoundError);
    expect(reminders.save).not.toHaveBeenCalled();
  });
});
