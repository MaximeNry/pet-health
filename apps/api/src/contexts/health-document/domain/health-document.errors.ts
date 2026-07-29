import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** A document business invariant was violated (empty title, future date...). */
export class InvalidHealthDocumentError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** No document matches the requested identifier. */
export class HealthDocumentNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(id: string) {
    super(`No health document found for the identifier « ${id} ».`);
  }
}

/** No page matches the requested identifier within the document. */
export class DocumentPageNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor(pageId: string) {
    super(`No document page found for the identifier « ${pageId} ».`);
  }
}

/**
 * The user's account has no (valid) Drive authorization, so the file cannot
 * be stored. Mapped to 409: the session is fine, but the account state
 * requires a new Google login to grant Drive access.
 */
export class MissingDriveAccessError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor() {
    super(
      'Google Drive access is not authorized for this account. Sign in with Google again to grant it.',
    );
  }
}
