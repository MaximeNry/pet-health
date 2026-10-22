import { Entity } from '../../../shared/domain/entity.base';
import { CalendarDate } from './calendar-date.vo';

/** Data required to record that the care was done. */
export interface NewCompletionData {
  doneOn: CalendarDate;
  doneBy: string;
  /** Optional proof, e.g. the scanned vaccination certificate (by id). */
  healthDocumentId?: string | null;
  /**
   * The due date this completion fulfilled, to tell "on time" from "late".
   * `null` when unknown: the first dose a reminder is created from, or an
   * older care backfilled after a more recent one.
   */
  dueOn?: CalendarDate | null;
}

/** Full snapshot of a persisted completion. */
export interface ReminderCompletionSnapshot {
  id: string;
  /** `YYYY-MM-DD`. */
  doneOn: string;
  doneBy: string;
  healthDocumentId: string | null;
  /** `YYYY-MM-DD` or `null`. */
  dueOn: string | null;
  createdAt: Date;
}

/**
 * One occurrence of the care actually being done. Entity *internal* to the
 * `Reminder` aggregate (created only through the root). Its day and author
 * are immutable once recorded; only the proof document can be attached
 * afterwards. The list of completions is the pet's care history.
 */
export class ReminderCompletion extends Entity {
  private readonly _doneOn: CalendarDate;
  private readonly _doneBy: string;
  private _healthDocumentId: string | null;
  private readonly _dueOn: CalendarDate | null;
  private readonly _createdAt: Date;

  private constructor(snapshot: ReminderCompletionSnapshot) {
    super(snapshot.id);
    this._doneOn = CalendarDate.parse(snapshot.doneOn);
    this._doneBy = snapshot.doneBy;
    this._healthDocumentId = snapshot.healthDocumentId;
    this._dueOn = snapshot.dueOn ? CalendarDate.parse(snapshot.dueOn) : null;
    this._createdAt = snapshot.createdAt;
  }

  /** Called only by the aggregate root, which validates the data first. */
  static create(data: NewCompletionData): ReminderCompletion {
    return new ReminderCompletion({
      id: globalThis.crypto.randomUUID(),
      doneOn: data.doneOn.toString(),
      doneBy: data.doneBy,
      healthDocumentId: data.healthDocumentId ?? null,
      dueOn: data.dueOn?.toString() ?? null,
      createdAt: new Date(),
    });
  }

  /** Rebuilds a completion from persistence (no id generation). */
  static fromSnapshot(
    snapshot: ReminderCompletionSnapshot,
  ): ReminderCompletion {
    return new ReminderCompletion(snapshot);
  }

  toSnapshot(): ReminderCompletionSnapshot {
    return {
      id: this.id,
      doneOn: this._doneOn.toString(),
      doneBy: this._doneBy,
      healthDocumentId: this._healthDocumentId,
      dueOn: this._dueOn?.toString() ?? null,
      createdAt: this._createdAt,
    };
  }

  /** Attaches (or, with `null`, detaches) the proof document. Root only. */
  attachDocument(healthDocumentId: string | null): void {
    this._healthDocumentId = healthDocumentId;
  }

  get doneOn(): CalendarDate {
    return this._doneOn;
  }

  get doneBy(): string {
    return this._doneBy;
  }

  get healthDocumentId(): string | null {
    return this._healthDocumentId;
  }

  get dueOn(): CalendarDate | null {
    return this._dueOn;
  }

  /**
   * Days between the due date and the day it was done: positive = late,
   * 0 = on the day, negative = early; `null` when the due date is unknown.
   */
  get daysLate(): number | null {
    return this._dueOn ? this._dueOn.daysUntil(this._doneOn) : null;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
