import { InvalidReminderError } from '../domain/reminder.errors';
import { resolveToday } from './client-today';

// 23:30 UTC on Oct 20 = 01:30 on Oct 21 in Paris.
const NOW = new Date('2026-10-20T23:30:00Z');

describe('resolveToday', () => {
  it('falls back to the server UTC day', () => {
    expect(resolveToday(undefined, NOW).toString()).toBe('2026-10-20');
    expect(resolveToday('', NOW).toString()).toBe('2026-10-20');
  });

  it('trusts a client day one day ahead (east of UTC)', () => {
    expect(resolveToday('2026-10-21', NOW).toString()).toBe('2026-10-21');
  });

  it('trusts a client day one day behind (west of UTC)', () => {
    expect(resolveToday('2026-10-19', NOW).toString()).toBe('2026-10-19');
  });

  it('rejects an implausible client day', () => {
    expect(() => resolveToday('2026-10-23', NOW)).toThrow(InvalidReminderError);
  });
});
