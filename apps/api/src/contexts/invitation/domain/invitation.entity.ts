import { Entity } from '../../../shared/domain/entity.base';
import {
  InvalidInvitationError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotPendingError,
} from './invitation.errors';

/**
 * Decided lifecycle states only. There is no EXPIRED status on purpose:
 * expiration is derived from `expiresAt` (see `isExpired`), so an invitation
 * never needs a background job to flip its state.
 */
export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const DEFAULT_EXPIRES_IN_DAYS = 7;

/** Data required to issue a new invitation. */
export interface CreateInvitationProps {
  householdId: string;
  invitedEmail: string;
  invitedBy: string;
  /** SHA-256 of the raw link token — the raw token is never persisted. */
  tokenHash: string;
  expiresInDays?: number;
}

/** Full snapshot of a persisted invitation. */
export interface InvitationSnapshot {
  id: string;
  householdId: string;
  invitedEmail: string;
  tokenHash: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: Date;
  acceptedBy: string | null;
  acceptedAt: Date | null;
  createdAt: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `Invitation` aggregate root — independent lifecycle, references the
 * household and the users by id only. The invited email is an AUTHORIZATION
 * constraint, not a delivery address: no email is ever sent, and only the
 * Google account whose verified email matches may redeem the link.
 */
export class Invitation extends Entity {
  private readonly _householdId: string;
  private readonly _invitedEmail: string;
  private readonly _tokenHash: string;
  private _status: InvitationStatus;
  private readonly _invitedBy: string;
  private readonly _expiresAt: Date;
  private _acceptedBy: string | null;
  private _acceptedAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(snapshot: InvitationSnapshot) {
    super(snapshot.id);
    this._householdId = snapshot.householdId;
    this._invitedEmail = snapshot.invitedEmail;
    this._tokenHash = snapshot.tokenHash;
    this._status = snapshot.status;
    this._invitedBy = snapshot.invitedBy;
    this._expiresAt = snapshot.expiresAt;
    this._acceptedBy = snapshot.acceptedBy;
    this._acceptedAt = snapshot.acceptedAt;
    this._createdAt = snapshot.createdAt;
  }

  /** Issues a PENDING invitation expiring `expiresInDays` from now. */
  static create(props: CreateInvitationProps): Invitation {
    const expiresInDays = props.expiresInDays ?? DEFAULT_EXPIRES_IN_DAYS;
    if (!Number.isInteger(expiresInDays) || expiresInDays <= 0) {
      throw new InvalidInvitationError(
        'The invitation lifetime must be a positive number of days.',
      );
    }
    if (!props.householdId || props.householdId.trim().length === 0) {
      throw new InvalidInvitationError('The household id is required.');
    }
    if (!props.invitedBy || props.invitedBy.trim().length === 0) {
      throw new InvalidInvitationError('The inviter id is required.');
    }
    if (!props.tokenHash || props.tokenHash.trim().length === 0) {
      throw new InvalidInvitationError('The token hash is required.');
    }
    const now = new Date();
    return new Invitation({
      id: globalThis.crypto.randomUUID(),
      householdId: props.householdId,
      invitedEmail: Invitation.normalizeEmail(props.invitedEmail),
      tokenHash: props.tokenHash,
      status: 'PENDING',
      invitedBy: props.invitedBy,
      expiresAt: new Date(now.getTime() + expiresInDays * MS_PER_DAY),
      acceptedBy: null,
      acceptedAt: null,
      createdAt: now,
    });
  }

  /** Rebuilds an aggregate from persistence (no id generation). */
  static fromSnapshot(snapshot: InvitationSnapshot): Invitation {
    return new Invitation(snapshot);
  }

  /** Expiration is derived from `expiresAt`, never stored as a status. */
  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt.getTime() < now.getTime();
  }

  /**
   * Redeems the invitation for the authenticated user. Validation order maps
   * to the API contract: not pending → conflict, expired → gone, email
   * mismatch → forbidden. `consumingEmail` must be the OAuth-verified email
   * of the signed-in user — that comparison IS the authorization check.
   */
  accept(consumingEmail: string, userId: string): void {
    if (this._status !== 'PENDING') {
      throw new InvitationNotPendingError(this._status);
    }
    if (this.isExpired()) {
      throw new InvitationExpiredError();
    }
    const email = Invitation.normalizeEmail(consumingEmail);
    if (email !== this._invitedEmail) {
      throw new InvitationEmailMismatchError(this._invitedEmail, email);
    }
    this._status = 'ACCEPTED';
    this._acceptedBy = userId;
    this._acceptedAt = new Date();
  }

  /** Withdraws a pending invitation; decided ones cannot be revoked. */
  revoke(): void {
    if (this._status !== 'PENDING') {
      throw new InvitationNotPendingError(this._status);
    }
    this._status = 'REVOKED';
  }

  get householdId(): string {
    return this._householdId;
  }

  get invitedEmail(): string {
    return this._invitedEmail;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get status(): InvitationStatus {
    return this._status;
  }

  get invitedBy(): string {
    return this._invitedBy;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get acceptedBy(): string | null {
    return this._acceptedBy;
  }

  get acceptedAt(): Date | null {
    return this._acceptedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toSnapshot(): InvitationSnapshot {
    return {
      id: this.id,
      householdId: this._householdId,
      invitedEmail: this._invitedEmail,
      tokenHash: this._tokenHash,
      status: this._status,
      invitedBy: this._invitedBy,
      expiresAt: this._expiresAt,
      acceptedBy: this._acceptedBy,
      acceptedAt: this._acceptedAt,
      createdAt: this._createdAt,
    };
  }

  /** Emails compare case-insensitively: Google logins normalize casing away. */
  static normalizeEmail(email: string): string {
    const normalized = email?.trim().toLowerCase() ?? '';
    if (normalized.length === 0 || !normalized.includes('@')) {
      throw new InvalidInvitationError('A valid email address is required.');
    }
    return normalized;
  }
}
