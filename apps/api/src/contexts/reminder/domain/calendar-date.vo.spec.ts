import { CalendarDate } from './calendar-date.vo';
import { InvalidReminderError } from './reminder.errors';

const d = (raw: string) => CalendarDate.parse(raw);

describe('CalendarDate', () => {
  it('round-trips a YYYY-MM-DD string', () => {
    expect(d('2026-10-20').toString()).toBe('2026-10-20');
  });

  it.each(['2026-02-30', '2026-13-01', '20-10-2026', '', '2026-10-20T00:00'])(
    'rejects « %s »',
    (raw) => {
      expect(() => d(raw)).toThrow(InvalidReminderError);
    },
  );

  it('reads the UTC day of an instant, ignoring the time', () => {
    expect(
      CalendarDate.fromDate(new Date('2026-10-20T23:30:00Z')).toString(),
    ).toBe('2026-10-20');
  });

  it('adds days across a month and a DST boundary', () => {
    expect(d('2026-10-20').addDays(14).toString()).toBe('2026-11-03');
  });

  it('adds months across a year boundary', () => {
    expect(d('2026-11-15').addMonths(3).toString()).toBe('2027-02-15');
  });

  it('clamps to the last day of a shorter month', () => {
    expect(d('2026-01-31').addMonths(1).toString()).toBe('2026-02-28');
    expect(d('2028-01-31').addMonths(1).toString()).toBe('2028-02-29');
    expect(d('2026-08-31').addMonths(3).toString()).toBe('2026-11-30');
  });

  it('counts signed days between two dates', () => {
    expect(d('2026-10-20').daysUntil(d('2026-10-27'))).toBe(7);
    expect(d('2026-10-20').daysUntil(d('2026-10-18'))).toBe(-2);
  });
});
