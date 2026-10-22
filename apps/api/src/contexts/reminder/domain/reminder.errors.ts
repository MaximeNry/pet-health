import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** A reminder business invariant was violated. */
export class InvalidReminderError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** No reminder matches the requested identifier. */
export class ReminderNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor() {
    super('No reminder matches this identifier.');
  }
}

/** The reminder is archived: it can no longer be completed or rescheduled. */
export class ReminderArchivedError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor() {
    super('This reminder is archived.');
  }
}

/** A completion is already recorded for that day (e.g. a double tap). */
export class ReminderAlreadyCompletedError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor(doneOn: string) {
    super(`This reminder is already marked as done on ${doneOn}.`, { doneOn });
  }
}

/** No completion of this reminder matches the requested identifier. */
export class ReminderCompletionNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor() {
    super('No completion of this reminder matches this identifier.');
  }
}

/** The referenced health document does not exist or belongs to another pet. */
export class ReminderDocumentNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(documentId: string) {
    super(`No document « ${documentId} » found for this pet.`);
  }
}

/** The pet a reminder is created for does not exist. */
export class ReminderPetNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(petId: string) {
    super(`No pet found for the identifier « ${petId} ».`);
  }
}
