import { CalendarDate } from '../domain/calendar-date.vo';
import { InvalidReminderError } from '../domain/reminder.errors';

/**
 * The user's local "today". Server-side UTC is a day off around midnight for
 * most users (e.g. 00:30 in Paris is still yesterday in UTC), which would
 * reject a care done "today" as being in the future. Clients may send their
 * local day; it is trusted only within one day of the server's UTC day — the
 * whole range of real time zones (UTC−12 … UTC+14).
 */
export function resolveToday(
  raw: string | undefined,
  now: Date = new Date(),
): CalendarDate {
  const serverToday = CalendarDate.today(now);
  if (raw === undefined || raw === '') {
    return serverToday;
  }
  const clientToday = CalendarDate.parse(raw);
  if (Math.abs(serverToday.daysUntil(clientToday)) > 1) {
    throw new InvalidReminderError(
      `« ${raw} » is not a plausible current date.`,
    );
  }
  return clientToday;
}
