import { CalendarDate } from './calendar-date.vo';
import { InvalidReminderError } from './reminder.errors';

export const RECURRENCE_UNITS = ['DAY', 'WEEK', 'MONTH', 'YEAR'] as const;
export type RecurrenceUnit = (typeof RECURRENCE_UNITS)[number];

/** Upper bound on `every`: guards against typos like "every 300 months". */
const MAX_EVERY = 100;

export interface RecurrenceProps {
  every: number;
  unit: RecurrenceUnit;
}

/**
 * How often a care repeats: "every 3 months", "every 1 year". Immutable,
 * compared by value. Owns the date arithmetic so the entity never has to
 * know how a month is added.
 */
export class Recurrence {
  private constructor(
    private readonly _every: number,
    private readonly _unit: RecurrenceUnit,
  ) {}

  static create(props: RecurrenceProps): Recurrence {
    if (!RECURRENCE_UNITS.includes(props.unit)) {
      throw new InvalidReminderError(
        `Invalid recurrence unit « ${props.unit} ». Accepted values: ${RECURRENCE_UNITS.join(', ')}.`,
      );
    }
    if (
      !Number.isInteger(props.every) ||
      props.every < 1 ||
      props.every > MAX_EVERY
    ) {
      throw new InvalidReminderError(
        `The recurrence interval must be a whole number between 1 and ${MAX_EVERY}.`,
      );
    }
    return new Recurrence(props.every, props.unit);
  }

  /** The next due day when the care was done on `doneOn`. */
  nextAfter(doneOn: CalendarDate): CalendarDate {
    switch (this._unit) {
      case 'DAY':
        return doneOn.addDays(this._every);
      case 'WEEK':
        return doneOn.addDays(this._every * 7);
      case 'MONTH':
        return doneOn.addMonths(this._every);
      case 'YEAR':
        return doneOn.addMonths(this._every * 12);
    }
  }

  get every(): number {
    return this._every;
  }

  get unit(): RecurrenceUnit {
    return this._unit;
  }

  equals(other: Recurrence): boolean {
    return this._every === other._every && this._unit === other._unit;
  }

  toProps(): RecurrenceProps {
    return { every: this._every, unit: this._unit };
  }
}
