import { CalendarDate } from './calendar-date.vo';
import { Recurrence, type RecurrenceUnit } from './recurrence.vo';
import { InvalidReminderError } from './reminder.errors';

describe('Recurrence', () => {
  it.each<[number, RecurrenceUnit, string]>([
    [10, 'DAY', '2026-10-30'],
    [2, 'WEEK', '2026-11-03'],
    [3, 'MONTH', '2027-01-20'],
    [1, 'YEAR', '2027-10-20'],
  ])('every %i %s after 2026-10-20 → %s', (every, unit, expected) => {
    const next = Recurrence.create({ every, unit }).nextAfter(
      CalendarDate.parse('2026-10-20'),
    );
    expect(next.toString()).toBe(expected);
  });

  it('handles a yearly recurrence from Feb 29', () => {
    const next = Recurrence.create({ every: 1, unit: 'YEAR' }).nextAfter(
      CalendarDate.parse('2028-02-29'),
    );
    expect(next.toString()).toBe('2029-02-28');
  });

  it.each([0, -1, 1.5, 101])('rejects an interval of %s', (every) => {
    expect(() => Recurrence.create({ every, unit: 'MONTH' })).toThrow(
      InvalidReminderError,
    );
  });

  it('rejects an unknown unit', () => {
    expect(() =>
      Recurrence.create({ every: 1, unit: 'HOUR' as RecurrenceUnit }),
    ).toThrow(InvalidReminderError);
  });

  it('compares by value', () => {
    expect(
      Recurrence.create({ every: 3, unit: 'MONTH' }).equals(
        Recurrence.create({ every: 3, unit: 'MONTH' }),
      ),
    ).toBe(true);
  });
});
