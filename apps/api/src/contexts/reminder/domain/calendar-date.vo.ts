import { InvalidReminderError } from './reminder.errors';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A calendar day (no time, no time zone), e.g. `2026-10-20`. Reminders are
 * about days, not instants: using a plain `Date` would let a time-zone shift
 * move a due date by one day. Internally anchored at UTC midnight so all
 * arithmetic is done in UTC, where days are always 24h long.
 */
export class CalendarDate {
  private constructor(private readonly utcMidnight: number) {}

  /** Parses a strict `YYYY-MM-DD` string, rejecting impossible dates. */
  static parse(raw: string): CalendarDate {
    const match = ISO_DATE.exec(raw ?? '');
    if (!match) {
      throw new InvalidReminderError(
        `Invalid date « ${raw} ». Expected format: YYYY-MM-DD.`,
      );
    }
    const [year, month, day] = match.slice(1).map(Number);
    const date = CalendarDate.of(year, month, day);
    // Date.UTC silently rolls 2026-02-30 over to March: reject it instead.
    if (date.month !== month || date.day !== day) {
      throw new InvalidReminderError(`Invalid date « ${raw} ».`);
    }
    return date;
  }

  /** The calendar day of an instant, read in UTC (e.g. a Postgres DATE). */
  static fromDate(date: Date): CalendarDate {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new InvalidReminderError('The date is invalid.');
    }
    return CalendarDate.of(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
  }

  /** Today in UTC. Callers that know the user's local day should pass it. */
  static today(now: Date = new Date()): CalendarDate {
    return CalendarDate.fromDate(now);
  }

  private static of(year: number, month: number, day: number): CalendarDate {
    return new CalendarDate(Date.UTC(year, month - 1, day));
  }

  get year(): number {
    return new Date(this.utcMidnight).getUTCFullYear();
  }

  /** 1-based month (January = 1). */
  get month(): number {
    return new Date(this.utcMidnight).getUTCMonth() + 1;
  }

  get day(): number {
    return new Date(this.utcMidnight).getUTCDate();
  }

  addDays(days: number): CalendarDate {
    return new CalendarDate(this.utcMidnight + days * MS_PER_DAY);
  }

  /**
   * Adds calendar months, clamping to the last day of the target month:
   * Jan 31 + 1 month = Feb 28 (or 29), never March 3.
   */
  addMonths(months: number): CalendarDate {
    const monthIndex = this.year * 12 + (this.month - 1) + months;
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return CalendarDate.of(year, month, Math.min(this.day, lastDay));
  }

  /** Signed number of days from `this` to `other` (positive if later). */
  daysUntil(other: CalendarDate): number {
    return Math.round((other.utcMidnight - this.utcMidnight) / MS_PER_DAY);
  }

  isBefore(other: CalendarDate): boolean {
    return this.utcMidnight < other.utcMidnight;
  }

  isAfter(other: CalendarDate): boolean {
    return this.utcMidnight > other.utcMidnight;
  }

  equals(other: CalendarDate): boolean {
    return this.utcMidnight === other.utcMidnight;
  }

  /** UTC midnight of the day, for persistence in a DATE column. */
  toDate(): Date {
    return new Date(this.utcMidnight);
  }

  /** `YYYY-MM-DD`. */
  toString(): string {
    return new Date(this.utcMidnight).toISOString().slice(0, 10);
  }
}
