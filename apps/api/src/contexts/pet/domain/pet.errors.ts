import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** A pet business invariant was violated (empty name, future birth date...). */
export class InvalidPetError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** No pet matches the requested identifier. */
export class PetNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(id: string) {
    super(`No pet found for the identifier « ${id} ».`);
  }
}
