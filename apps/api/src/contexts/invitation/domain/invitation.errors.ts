import {
  DomainError,
  DomainErrorKind,
} from '../../../shared/domain/domain-error';

/** An invitation business invariant was violated. */
export class InvalidInvitationError extends DomainError {
  readonly kind: DomainErrorKind = 'validation';

  constructor(message: string) {
    super(message);
  }
}

/** No invitation matches the requested identifier or token. */
export class InvitationNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';

  constructor() {
    super('No invitation matches this link.');
  }
}

/** The invitation has already been decided (accepted or revoked). */
export class InvitationNotPendingError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor(status: string) {
    super(
      status === 'ACCEPTED'
        ? 'This invitation has already been accepted.'
        : 'This invitation has been revoked.',
    );
  }
}

/** The invitation is past its expiration date (derived, not a status). */
export class InvitationExpiredError extends DomainError {
  readonly kind: DomainErrorKind = 'gone';

  constructor() {
    super('This invitation has expired.');
  }
}

/**
 * The Google account redeeming the link is not the one the invitation was
 * issued for. `details` carries both emails so the client can show which
 * account to switch to without parsing the message.
 */
export class InvitationEmailMismatchError extends DomainError {
  readonly kind: DomainErrorKind = 'forbidden';

  constructor(invitedEmail: string, signedInEmail: string) {
    super(
      `This invitation was issued for « ${invitedEmail} », but you are signed in as « ${signedInEmail} ».`,
      { invitedEmail, signedInEmail },
    );
  }
}

/** A pending invitation already exists for this email in the household. */
export class PendingInvitationAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';

  constructor(invitedEmail: string) {
    super(
      `A pending invitation already exists for « ${invitedEmail} » in this household.`,
    );
  }
}
