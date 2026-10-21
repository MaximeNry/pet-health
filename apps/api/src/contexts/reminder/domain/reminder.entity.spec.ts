import { CalendarDate } from './calendar-date.vo';
import { Reminder, type CreateReminderProps } from './reminder.entity';
import {
  InvalidReminderError,
  ReminderAlreadyCompletedError,
  ReminderArchivedError,
  ReminderCompletionNotFoundError,
} from './reminder.errors';

const d = (raw: string) => CalendarDate.parse(raw);
const TODAY = d('2026-10-20');

const antiparasitic = (
  overrides: Partial<CreateReminderProps> = {},
): Reminder =>
  Reminder.create({
    petId: 'pet-1',
    householdId: 'household-1',
    createdBy: 'user-1',
    title: 'Antiparasitic',
    category: 'ANTIPARASITIC',
    dueDate: d('2026-10-25'),
    recurrence: { every: 3, unit: 'MONTH' },
    ...overrides,
  });

const done = (doneOn: string, doneBy = 'user-2') => ({
  doneOn: d(doneOn),
  doneBy,
});

describe('Reminder', () => {
  describe('create', () => {
    it('creates an ACTIVE reminder with a trimmed title', () => {
      const reminder = antiparasitic({ title: '  Antiparasitic  ' });

      expect(reminder.id).toBeDefined();
      expect(reminder.status).toBe('ACTIVE');
      expect(reminder.title).toBe('Antiparasitic');
      expect(reminder.dueDate.toString()).toBe('2026-10-25');
      expect(reminder.completions).toEqual([]);
    });

    it('accepts a due date in the past (care already late)', () => {
      const reminder = antiparasitic({ dueDate: d('2026-09-01') });
      expect(reminder.urgency(TODAY)).toBe('OVERDUE');
    });

    it.each<[string, Partial<CreateReminderProps>]>([
      ['an empty title', { title: '   ' }],
      ['a too long title', { title: 'x'.repeat(121) }],
      ['an unknown category', { category: 'GROOMING' }],
      ['a missing pet id', { petId: '' }],
      ['an invalid recurrence', { recurrence: { every: 0, unit: 'MONTH' } }],
    ])('rejects %s', (_, overrides) => {
      expect(() => antiparasitic(overrides)).toThrow(InvalidReminderError);
    });
  });

  describe('complete', () => {
    it('computes the next due date from the day the care was done', () => {
      const reminder = antiparasitic({ dueDate: d('2026-10-01') });

      // Given two weeks late: the next one moves accordingly.
      reminder.complete(done('2026-10-15'), TODAY);

      expect(reminder.dueDate.toString()).toBe('2027-01-15');
      expect(reminder.status).toBe('ACTIVE');
      expect(reminder.lastDoneOn?.toString()).toBe('2026-10-15');
    });

    it('records who did it and the optional proof document', () => {
      const reminder = antiparasitic();

      const completion = reminder.complete(
        { ...done('2026-10-20'), healthDocumentId: 'doc-1' },
        TODAY,
      );

      expect(completion.doneBy).toBe('user-2');
      expect(completion.healthDocumentId).toBe('doc-1');
      expect(reminder.completions).toHaveLength(1);
    });

    it('archives a one-off reminder', () => {
      const reminder = antiparasitic({ title: 'Checkup', recurrence: null });

      reminder.complete(done('2026-10-20'), TODAY);

      expect(reminder.status).toBe('ARCHIVED');
      expect(reminder.urgency(TODAY)).toBeNull();
    });

    it('keeps deriving the due date from the latest completion when an older one is backfilled', () => {
      const reminder = antiparasitic();
      reminder.complete(done('2026-10-10'), TODAY);

      reminder.complete(done('2026-07-10'), TODAY);

      expect(reminder.dueDate.toString()).toBe('2027-01-10');
      expect(reminder.completions.map((c) => c.doneOn.toString())).toEqual([
        '2026-10-10',
        '2026-07-10',
      ]);
    });

    it('rejects a completion in the future', () => {
      expect(() => antiparasitic().complete(done('2026-10-21'), TODAY)).toThrow(
        InvalidReminderError,
      );
    });

    it('rejects a second completion on the same day', () => {
      const reminder = antiparasitic();
      reminder.complete(done('2026-10-20'), TODAY);

      expect(() => reminder.complete(done('2026-10-20'), TODAY)).toThrow(
        ReminderAlreadyCompletedError,
      );
    });

    it('rejects completing an archived reminder', () => {
      const reminder = antiparasitic();
      reminder.archive();

      expect(() => reminder.complete(done('2026-10-20'), TODAY)).toThrow(
        ReminderArchivedError,
      );
    });
  });

  describe('reschedule', () => {
    it('moves the due date', () => {
      const reminder = antiparasitic();
      reminder.reschedule(d('2026-11-15'));
      expect(reminder.dueDate.toString()).toBe('2026-11-15');
    });

    it('rejects rescheduling an archived reminder', () => {
      const reminder = antiparasitic();
      reminder.archive();
      expect(() => reminder.reschedule(d('2026-11-15'))).toThrow(
        ReminderArchivedError,
      );
    });
  });

  describe('edit', () => {
    it('re-derives the due date from the last completion when the recurrence changes', () => {
      const reminder = antiparasitic();
      reminder.complete(done('2026-10-20'), TODAY);

      reminder.edit({ recurrence: { every: 1, unit: 'MONTH' } });

      expect(reminder.dueDate.toString()).toBe('2026-11-20');
    });

    it('keeps the due date when there is no completion yet', () => {
      const reminder = antiparasitic();
      reminder.edit({ recurrence: { every: 1, unit: 'MONTH' } });
      expect(reminder.dueDate.toString()).toBe('2026-10-25');
    });

    it('turns a recurring reminder into a one-off one', () => {
      const reminder = antiparasitic();
      reminder.edit({ recurrence: null });
      expect(reminder.recurrence).toBeNull();
    });

    it('leaves omitted fields untouched', () => {
      const reminder = antiparasitic();
      reminder.edit({ title: 'Bravecto' });

      expect(reminder.title).toBe('Bravecto');
      expect(reminder.category).toBe('ANTIPARASITIC');
      expect(reminder.recurrence?.toProps()).toEqual({
        every: 3,
        unit: 'MONTH',
      });
    });
  });

  describe('urgency', () => {
    it.each([
      ['2026-10-19', 'OVERDUE', -1],
      ['2026-10-20', 'DUE_SOON', 0],
      ['2026-10-26', 'DUE_SOON', 6],
      ['2026-10-27', 'UPCOMING', 7],
    ])('due %s → %s (%i days)', (dueDate, urgency, days) => {
      const reminder = antiparasitic({ dueDate: d(dueDate) });
      expect(reminder.urgency(TODAY)).toBe(urgency);
      expect(reminder.daysUntilDue(TODAY)).toBe(days);
    });
  });

  describe('create from a care already done', () => {
    it('records the first completion and derives the due date from it', () => {
      const reminder = Reminder.create(
        {
          petId: 'pet-1',
          householdId: 'household-1',
          createdBy: 'user-1',
          title: 'Rabies booster',
          category: 'VACCINE',
          recurrence: { every: 1, unit: 'YEAR' },
          sourceDocumentId: 'doc-1',
          lastDone: { doneOn: d('2025-10-23'), healthDocumentId: 'doc-1' },
        },
        TODAY,
      );

      expect(reminder.dueDate.toString()).toBe('2026-10-23');
      expect(reminder.completions[0].doneBy).toBe('user-1');
      expect(reminder.completions[0].dueOn).toBeNull();
      expect(reminder.completions[0].daysLate).toBeNull();
    });

    it("keeps an explicit due date (the vet's own date wins)", () => {
      const reminder = antiparasitic({
        dueDate: d('2026-12-01'),
        lastDone: { doneOn: d('2026-10-01') },
      });
      expect(reminder.dueDate.toString()).toBe('2026-12-01');
    });

    it('rejects starting a one-off reminder as already done', () => {
      expect(() =>
        antiparasitic({
          recurrence: null,
          lastDone: { doneOn: d('2026-10-01') },
        }),
      ).toThrow(InvalidReminderError);
    });

    it('requires a due date when nothing was done yet', () => {
      expect(() => antiparasitic({ dueDate: null })).toThrow(
        InvalidReminderError,
      );
    });
  });

  describe('completion timing', () => {
    it('remembers the due date each completion fulfilled', () => {
      const reminder = antiparasitic({ dueDate: d('2026-10-15') });

      reminder.complete(done('2026-10-19'), TODAY);

      const [completion] = reminder.completions;
      expect(completion.dueOn?.toString()).toBe('2026-10-15');
      expect(completion.daysLate).toBe(4);
    });

    it('counts a care given early as negative lateness', () => {
      const reminder = antiparasitic({ dueDate: d('2026-10-25') });
      reminder.complete(done('2026-10-20'), TODAY);
      expect(reminder.completions[0].daysLate).toBe(-5);
    });

    it('does not guess the due date of a backfilled older care', () => {
      const reminder = antiparasitic();
      reminder.complete(done('2026-10-10'), TODAY);

      reminder.complete(done('2026-07-10'), TODAY);

      const backfilled = reminder.completions[1];
      expect(backfilled.doneOn.toString()).toBe('2026-07-10');
      expect(backfilled.dueOn).toBeNull();
    });
  });

  describe('attachProof', () => {
    it('attaches a proof after the fact, even once archived', () => {
      const reminder = antiparasitic({ title: 'Checkup', recurrence: null });
      const completion = reminder.complete(done('2026-10-20'), TODAY);

      reminder.attachProof(completion.id, 'receipt-1');

      expect(reminder.status).toBe('ARCHIVED');
      expect(reminder.completions[0].healthDocumentId).toBe('receipt-1');
    });

    it('detaches a proof with null', () => {
      const reminder = antiparasitic();
      const completion = reminder.complete(
        { ...done('2026-10-20'), healthDocumentId: 'doc-1' },
        TODAY,
      );

      reminder.attachProof(completion.id, null);

      expect(reminder.completions[0].healthDocumentId).toBeNull();
    });

    it('rejects an unknown completion', () => {
      expect(() => antiparasitic().attachProof('nope', 'doc-1')).toThrow(
        ReminderCompletionNotFoundError,
      );
    });
  });

  describe('basedOnDocumentId', () => {
    it('is the latest proof, else the source document', () => {
      const reminder = antiparasitic({ sourceDocumentId: 'source' });
      expect(reminder.basedOnDocumentId).toBe('source');

      reminder.complete(
        { ...done('2026-10-10'), healthDocumentId: 'proof-oct' },
        TODAY,
      );
      reminder.complete(done('2026-07-10'), TODAY);

      expect(reminder.basedOnDocumentId).toBe('proof-oct');
    });
  });

  it('round-trips through a snapshot', () => {
    const reminder = antiparasitic();
    reminder.complete(
      { ...done('2026-10-20'), healthDocumentId: 'doc-1' },
      TODAY,
    );

    const rebuilt = Reminder.fromSnapshot(reminder.toSnapshot());

    expect(rebuilt.toSnapshot()).toEqual(reminder.toSnapshot());
  });
});
