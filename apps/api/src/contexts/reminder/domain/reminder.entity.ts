import { Entity } from '../../../shared/domain/entity.base';
import { CalendarDate } from './calendar-date.vo';
import { Recurrence, type RecurrenceProps } from './recurrence.vo';
import { ReminderCategory } from './reminder-category.vo';
import {
  ReminderCompletion,
  type NewCompletionData,
  type ReminderCompletionSnapshot,
} from './reminder-completion.entity';
import {
  InvalidReminderError,
  ReminderAlreadyCompletedError,
  ReminderArchivedError,
  ReminderCompletionNotFoundError,
} from './reminder.errors';

/**
 * Decided lifecycle states only. Urgency (overdue, due soon) is derived from
 * the due date at read time (see `urgency`), so no background job ever has to
 * flip a reminder's state.
 */
export const REMINDER_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export type ReminderUrgency = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';

/** A reminder due within this many days (today included) is "due soon". */
export const DUE_SOON_WITHIN_DAYS = 7;

const MAX_TITLE_LENGTH = 120;

/** Data required to create a reminder. */
export interface CreateReminderProps {
  petId: string;
  householdId: string;
  createdBy: string;
  title: string;
  category: string;
  /**
   * Required, except when starting from a care already done (`lastDone`):
   * then it defaults to the next occurrence after it.
   */
  dueDate?: CalendarDate | null;
  /** Omitted or null for a one-off reminder. */
  recurrence?: RecurrenceProps | null;
  /** The record this reminder follows up on (e.g. a surgery report). */
  sourceDocumentId?: string | null;
  /**
   * The care was already given once (e.g. the vaccination being scanned):
   * recorded as the first completion. Recurring reminders only.
   */
  lastDone?: { doneOn: CalendarDate; healthDocumentId?: string | null } | null;
}

/** Editable fields; omitted = untouched, `recurrence: null` = make one-off. */
export interface EditReminderProps {
  title?: string;
  category?: string;
  recurrence?: RecurrenceProps | null;
}

/** Data required to mark the care as done. */
export interface CompleteReminderProps {
  doneOn: CalendarDate;
  doneBy: string;
  healthDocumentId?: string | null;
}

/** Full snapshot of a persisted reminder. Days are `YYYY-MM-DD` strings. */
export interface ReminderSnapshot {
  id: string;
  petId: string;
  householdId: string;
  createdBy: string;
  title: string;
  category: string;
  dueDate: string;
  recurrence: RecurrenceProps | null;
  sourceDocumentId: string | null;
  status: ReminderStatus;
  completions: ReminderCompletionSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * `Reminder` aggregate root: a care to give a pet on a given day, optionally
 * repeating ("antiparasitic every 3 months", "rabies booster every year").
 * References the pet, household and users by id only.
 *
 * Core rule: the next due date is computed from the day the care was
 * ACTUALLY done, not from the previous due date — a treatment given two weeks
 * late moves the next one two weeks later, as it does medically. It is
 * always derived from the most recent completion, so recording an older one
 * (e.g. backfilling a vaccination booklet) only adds history.
 */
export class Reminder extends Entity {
  private readonly _petId: string;
  private readonly _householdId: string;
  private readonly _createdBy: string;
  private _title: string;
  private _category: ReminderCategory;
  private _dueDate: CalendarDate;
  private _recurrence: Recurrence | null;
  private readonly _sourceDocumentId: string | null;
  private _status: ReminderStatus;
  private _completions: ReminderCompletion[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(snapshot: ReminderSnapshot) {
    super(snapshot.id);
    this._petId = snapshot.petId;
    this._householdId = snapshot.householdId;
    this._createdBy = snapshot.createdBy;
    this._title = snapshot.title;
    this._category = ReminderCategory.create(snapshot.category);
    this._dueDate = CalendarDate.parse(snapshot.dueDate);
    this._recurrence = snapshot.recurrence
      ? Recurrence.create(snapshot.recurrence)
      : null;
    this._sourceDocumentId = snapshot.sourceDocumentId;
    this._status = snapshot.status;
    this._completions = snapshot.completions.map((completion) =>
      ReminderCompletion.fromSnapshot(completion),
    );
    this._createdAt = snapshot.createdAt;
    this._updatedAt = snapshot.updatedAt;
  }

  /**
   * Creates an ACTIVE reminder. A due date in the past is allowed on purpose:
   * the user may register a care that is already late. Starting from a care
   * already done (`lastDone`, e.g. creating the reminder from a scanned
   * vaccination) records it as the first completion, from which the due date
   * is derived unless one is given explicitly (the vet's own date wins).
   */
  static create(
    props: CreateReminderProps,
    today: CalendarDate = CalendarDate.today(),
  ): Reminder {
    if (props.lastDone && !props.recurrence) {
      throw new InvalidReminderError(
        'Only a recurring reminder can start from a care already done.',
      );
    }
    const initialDueDate = props.dueDate ?? props.lastDone?.doneOn;
    if (!initialDueDate) {
      throw new InvalidReminderError('The due date is required.');
    }
    const now = new Date();
    const reminder = new Reminder({
      id: globalThis.crypto.randomUUID(),
      petId: Reminder.requireId(props.petId, 'petId'),
      householdId: Reminder.requireId(props.householdId, 'householdId'),
      createdBy: Reminder.requireId(props.createdBy, 'createdBy'),
      title: Reminder.normalizeTitle(props.title),
      category: ReminderCategory.create(props.category).toString(),
      dueDate: initialDueDate.toString(),
      recurrence: props.recurrence
        ? Recurrence.create(props.recurrence).toProps()
        : null,
      sourceDocumentId: props.sourceDocumentId ?? null,
      status: 'ACTIVE',
      completions: [],
      createdAt: now,
      updatedAt: now,
    });
    if (props.lastDone) {
      // Its due date is unknown: the reminder did not exist yet.
      reminder.recordCompletion(
        { ...props.lastDone, doneBy: props.createdBy, dueOn: null },
        today,
      );
      if (props.dueDate) {
        reminder._dueDate = props.dueDate;
      }
    }
    return reminder;
  }

  /** Rebuilds an aggregate from persistence (no id generation). */
  static fromSnapshot(snapshot: ReminderSnapshot): Reminder {
    return new Reminder(snapshot);
  }

  toSnapshot(): ReminderSnapshot {
    return {
      id: this.id,
      petId: this._petId,
      householdId: this._householdId,
      createdBy: this._createdBy,
      title: this._title,
      category: this._category.toString(),
      dueDate: this._dueDate.toString(),
      recurrence: this._recurrence?.toProps() ?? null,
      sourceDocumentId: this._sourceDocumentId,
      status: this._status,
      completions: this._completions.map((completion) =>
        completion.toSnapshot(),
      ),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Records that the care was done on `doneOn`. A recurring reminder moves
   * its due date to the next occurrence after the latest completion; a
   * one-off reminder is archived. Rejects a future day (the care cannot have
   * been done yet) and a second completion on the same day. The completion
   * remembers the due date it fulfilled, unless it is an older care being
   * backfilled (it fulfilled some earlier, unknown due date).
   */
  complete(
    props: CompleteReminderProps,
    today: CalendarDate = CalendarDate.today(),
  ): ReminderCompletion {
    const lastDoneOn = this.lastDoneOn;
    const isBackfill = lastDoneOn !== null && props.doneOn.isBefore(lastDoneOn);
    return this.recordCompletion(
      { ...props, dueOn: isBackfill ? null : this._dueDate },
      today,
    );
  }

  /**
   * Attaches the proof of a completion after the fact (e.g. the receipt
   * scanned right after marking the care as done); `null` detaches it.
   * Allowed on an archived reminder: its history stays editable.
   */
  attachProof(completionId: string, healthDocumentId: string | null): void {
    const completion = this._completions.find((c) => c.id === completionId);
    if (!completion) {
      throw new ReminderCompletionNotFoundError();
    }
    completion.attachDocument(healthDocumentId);
    this._updatedAt = new Date();
  }

  private recordCompletion(
    props: NewCompletionData,
    today: CalendarDate,
  ): ReminderCompletion {
    this.assertActive();
    Reminder.requireId(props.doneBy, 'doneBy');
    if (props.doneOn.isAfter(today)) {
      throw new InvalidReminderError(
        'A care cannot be marked as done in the future.',
      );
    }
    if (this._completions.some((c) => c.doneOn.equals(props.doneOn))) {
      throw new ReminderAlreadyCompletedError(props.doneOn.toString());
    }

    const completion = ReminderCompletion.create(props);
    this._completions = [...this._completions, completion];
    if (this._recurrence) {
      this._dueDate = this._recurrence.nextAfter(
        this.lastDoneOn ?? props.doneOn,
      );
    } else {
      this._status = 'ARCHIVED';
    }
    this._updatedAt = new Date();
    return completion;
  }

  /** Moves the next due date by hand (e.g. the vet advised to wait). */
  reschedule(dueDate: CalendarDate): void {
    this.assertActive();
    this._dueDate = dueDate;
    this._updatedAt = new Date();
  }

  /**
   * Edits the reminder's description. Changing the recurrence re-derives the
   * due date from the latest completion when there is one, so "every 3
   * months" → "every month" takes effect right away.
   */
  edit(changes: EditReminderProps): void {
    if (changes.title !== undefined) {
      this._title = Reminder.normalizeTitle(changes.title);
    }
    if (changes.category !== undefined) {
      this._category = ReminderCategory.create(changes.category);
    }
    if (changes.recurrence !== undefined) {
      this._recurrence = changes.recurrence
        ? Recurrence.create(changes.recurrence)
        : null;
      const lastDoneOn = this.lastDoneOn;
      if (this._recurrence && lastDoneOn && this._status === 'ACTIVE') {
        this._dueDate = this._recurrence.nextAfter(lastDoneOn);
      }
    }
    this._updatedAt = new Date();
  }

  /** Stops following the care (e.g. treatment discontinued). */
  archive(): void {
    this.assertActive();
    this._status = 'ARCHIVED';
    this._updatedAt = new Date();
  }

  /** Derived, never stored. `null` once the reminder is archived. */
  urgency(today: CalendarDate = CalendarDate.today()): ReminderUrgency | null {
    if (this._status !== 'ACTIVE') {
      return null;
    }
    const days = this.daysUntilDue(today);
    if (days < 0) {
      return 'OVERDUE';
    }
    return days < DUE_SOON_WITHIN_DAYS ? 'DUE_SOON' : 'UPCOMING';
  }

  /** Signed: negative when overdue, 0 when due today. */
  daysUntilDue(today: CalendarDate = CalendarDate.today()): number {
    return today.daysUntil(this._dueDate);
  }

  /**
   * The record shown as what the reminder is "based on": the most recent
   * proof attached to a completion, else the document it was created from.
   */
  get basedOnDocumentId(): string | null {
    const withProof = this.completions.find((c) => c.healthDocumentId);
    return withProof?.healthDocumentId ?? this._sourceDocumentId;
  }

  get sourceDocumentId(): string | null {
    return this._sourceDocumentId;
  }

  /** Day of the most recent completion, if any. */
  get lastDoneOn(): CalendarDate | null {
    return this.completions[0]?.doneOn ?? null;
  }

  get petId(): string {
    return this._petId;
  }

  get householdId(): string {
    return this._householdId;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get title(): string {
    return this._title;
  }

  get category(): string {
    return this._category.toString();
  }

  get dueDate(): CalendarDate {
    return this._dueDate;
  }

  get recurrence(): Recurrence | null {
    return this._recurrence;
  }

  get status(): ReminderStatus {
    return this._status;
  }

  /** Completions, most recent day first (a copy; mutate via the root only). */
  get completions(): ReminderCompletion[] {
    return [...this._completions].sort((a, b) => a.doneOn.daysUntil(b.doneOn));
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private assertActive(): void {
    if (this._status !== 'ACTIVE') {
      throw new ReminderArchivedError();
    }
  }

  private static normalizeTitle(title: string): string {
    const trimmed = title?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new InvalidReminderError('The reminder title is required.');
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      throw new InvalidReminderError(
        `The reminder title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
      );
    }
    return trimmed;
  }

  private static requireId(value: string, field: string): string {
    if (!value || value.trim().length === 0) {
      throw new InvalidReminderError(`The « ${field} » is required.`);
    }
    return value;
  }
}
