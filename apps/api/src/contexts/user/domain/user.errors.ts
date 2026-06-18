import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** A user business invariant was violated. */
export class InvalidUserError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** A user already exists with the same email (email is unique across users). */
export class EmailAlreadyTakenError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor(email: string) {
    super(`A user already exists with the email « ${email} ».`);
  }
}

/** No user matches the requested identifier. */
export class UserNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(id: string) {
    super(`No user found for the identifier « ${id} ».`);
  }
}
