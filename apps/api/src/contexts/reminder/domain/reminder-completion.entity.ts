import { Entity } from '../../../shared/domain/entity.base';
import { CalendarDate } from './calendar-date.vo';

/** Data required to record that the care was done. */
export interface NewCompletionData {
  doneOn: CalendarDate;
  doneBy: string;
  /** Optional proof, e.g. the scanned vaccination certificate (by id). */
  healthDocumentId?: string | null;
}

/** Full snapshot of a persisted completion. */
export interface ReminderCompletionSnapshot {
  id: string;
  /** `YYYY-MM-DD`. */
  doneOn: string;
  doneBy: string;
  healthDocumentId: string | null;
  createdAt: Date;
}

/**
 * One occurrence of the care actually being done. Entity *internal* to the
 * `Reminder` aggregate (created only through `Reminder.complete`), immutable
 * once recorded. The list of completions is the pet's care history.
 */
export class ReminderCompletion extends Entity {
  private readonly _doneOn: CalendarDate;
  private readonly _doneBy: string;
  private readonly _healthDocumentId: string | null;
  private readonly _createdAt: Date;

  private constructor(snapshot: ReminderCompletionSnapshot) {
    super(snapshot.id);
    this._doneOn = CalendarDate.parse(snapshot.doneOn);
    this._doneBy = snapshot.doneBy;
    this._healthDocumentId = snapshot.healthDocumentId;
    this._createdAt = snapshot.createdAt;
  }

  /** Called only by the aggregate root, which validates the data first. */
  static create(data: NewCompletionData): ReminderCompletion {
    return new ReminderCompletion({
      id: globalThis.crypto.randomUUID(),
      doneOn: data.doneOn.toString(),
      doneBy: data.doneBy,
      healthDocumentId: data.healthDocumentId ?? null,
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
      createdAt: this._createdAt,
    };
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

  get createdAt(): Date {
    return this._createdAt;
  }
}
