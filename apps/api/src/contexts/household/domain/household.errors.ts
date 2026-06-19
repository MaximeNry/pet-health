import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** A household business invariant was violated. */
export class InvalidHouseholdError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** No household matches the requested identifier. */
export class HouseholdNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(id: string) {
    super(`No household found for the identifier « ${id} ».`);
  }
}

/** The user is already a member of the household. */
export class MemberAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor(userId: string) {
    super(`User « ${userId} » is already a member of this household.`);
  }
}

/** The user is not a member of the household. */
export class MemberNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(userId: string) {
    super(`User « ${userId} » is not a member of this household.`);
  }
}
