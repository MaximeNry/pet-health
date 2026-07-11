import { Invitation } from './invitation.entity';
import {
  InvalidInvitationError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotPendingError,
} from './invitation.errors';

const HOUSEHOLD = 'household-1';
const INVITER = 'user-owner';
const ACCEPTER = 'user-guest';
const EMAIL = 'camila.rojas@gmail.com';

const make = (
  overrides: Partial<Parameters<typeof Invitation.create>[0]> = {},
) =>
  Invitation.create({
    householdId: HOUSEHOLD,
    invitedEmail: EMAIL,
    invitedBy: INVITER,
    tokenHash: 'a'.repeat(64),
    ...overrides,
  });

/** A pending invitation whose expiration date is already in the past. */
const makeExpired = () => {
  const invitation = make();
  return Invitation.fromSnapshot({
    ...invitation.toSnapshot(),
    expiresAt: new Date(Date.now() - 1000),
  });
};

describe('Invitation', () => {
  describe('create', () => {
    it('issues a PENDING invitation expiring 7 days from now by default', () => {
      const before = Date.now();
      const invitation = make();

      expect(invitation.status).toBe('PENDING');
      expect(invitation.acceptedBy).toBeNull();
      expect(invitation.acceptedAt).toBeNull();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(invitation.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + sevenDays,
      );
      expect(invitation.expiresAt.getTime()).toBeLessThanOrEqual(
        Date.now() + sevenDays,
      );
    });

    it('normalizes the invited email (trim + lowercase)', () => {
      expect(
        make({ invitedEmail: '  Camila.Rojas@GMAIL.com ' }).invitedEmail,
      ).toBe(EMAIL);
    });

    it('rejects an invalid email', () => {
      expect(() => make({ invitedEmail: 'not-an-email' })).toThrow(
        InvalidInvitationError,
      );
    });

    it('rejects a non-positive lifetime', () => {
      expect(() => make({ expiresInDays: 0 })).toThrow(InvalidInvitationError);
      expect(() => make({ expiresInDays: -3 })).toThrow(InvalidInvitationError);
    });
  });

  describe('isExpired', () => {
    it('derives expiration from expiresAt (no stored status)', () => {
      expect(make().isExpired()).toBe(false);
      expect(makeExpired().isExpired()).toBe(true);
      expect(makeExpired().status).toBe('PENDING');
    });
  });

  describe('accept', () => {
    it('marks the invitation accepted for the matching email', () => {
      const invitation = make();

      invitation.accept(EMAIL, ACCEPTER);

      expect(invitation.status).toBe('ACCEPTED');
      expect(invitation.acceptedBy).toBe(ACCEPTER);
      expect(invitation.acceptedAt).toBeInstanceOf(Date);
    });

    it('compares emails case-insensitively', () => {
      const invitation = make();

      invitation.accept(' Camila.Rojas@Gmail.com ', ACCEPTER);

      expect(invitation.status).toBe('ACCEPTED');
    });

    it('rejects an already accepted invitation', () => {
      const invitation = make();
      invitation.accept(EMAIL, ACCEPTER);

      expect(() => invitation.accept(EMAIL, ACCEPTER)).toThrow(
        InvitationNotPendingError,
      );
    });

    it('rejects a revoked invitation', () => {
      const invitation = make();
      invitation.revoke();

      expect(() => invitation.accept(EMAIL, ACCEPTER)).toThrow(
        InvitationNotPendingError,
      );
    });

    it('rejects an expired invitation', () => {
      expect(() => makeExpired().accept(EMAIL, ACCEPTER)).toThrow(
        InvitationExpiredError,
      );
    });

    it('rejects a different signed-in email, exposing both emails', () => {
      const invitation = make();

      let caught: unknown;
      try {
        invitation.accept('someone.else@gmail.com', ACCEPTER);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(InvitationEmailMismatchError);
      expect((caught as InvitationEmailMismatchError).details).toEqual({
        invitedEmail: EMAIL,
        signedInEmail: 'someone.else@gmail.com',
      });
      expect(invitation.status).toBe('PENDING');
    });

    it('checks the status before expiration and email (contract order)', () => {
      const invitation = make();
      invitation.revoke();

      // Even with a mismatching email, the decided status wins (409 over 403).
      expect(() =>
        invitation.accept('someone.else@gmail.com', ACCEPTER),
      ).toThrow(InvitationNotPendingError);
    });
  });

  describe('revoke', () => {
    it('revokes a pending invitation', () => {
      const invitation = make();

      invitation.revoke();

      expect(invitation.status).toBe('REVOKED');
    });

    it('still revokes an expired-but-pending invitation', () => {
      const invitation = makeExpired();

      invitation.revoke();

      expect(invitation.status).toBe('REVOKED');
    });

    it('rejects revoking an accepted invitation', () => {
      const invitation = make();
      invitation.accept(EMAIL, ACCEPTER);

      expect(() => invitation.revoke()).toThrow(InvitationNotPendingError);
    });
  });
});
