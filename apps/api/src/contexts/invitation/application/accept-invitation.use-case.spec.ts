import { Household } from '../../household/domain/household.entity';
import type { HouseholdRepository } from '../../household/domain/household.repository';
import { Invitation } from '../domain/invitation.entity';
import {
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotFoundError,
  InvitationNotPendingError,
} from '../domain/invitation.errors';
import type { InvitationRepository } from '../domain/invitation.repository';
import type { InvitationTokenService } from '../domain/invitation-token.port';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';

const EMAIL = 'camila.rojas@example.com';
const GUEST = 'user-guest';
const TOKEN = 'raw-token';
const TOKEN_HASH = `hashed:${TOKEN}`;

/** Deterministic stand-in for the crypto adapter. */
const tokens: InvitationTokenService = {
  generate: () => ({ token: TOKEN, tokenHash: TOKEN_HASH }),
  hash: (token: string) => `hashed:${token}`,
};

const makeHousehold = () =>
  Household.create({ name: 'Foyer Noury', ownerId: 'user-owner' });

const makeInvitation = (household: Household) =>
  Invitation.create({
    householdId: household.id,
    invitedEmail: EMAIL,
    invitedBy: 'user-owner',
    tokenHash: TOKEN_HASH,
  });

function makeRepos(invitation: Invitation | null, household: Household) {
  const invitations: jest.Mocked<InvitationRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByTokenHash: jest.fn().mockResolvedValue(invitation),
    findByHouseholdId: jest.fn(),
    findPendingByEmail: jest.fn(),
    saveAcceptedWithMembership: jest.fn().mockImplementation(() => {
      // Mirror the adapter's idempotent enrollment so the reloaded household
      // contains the new member.
      if (!household.members.some((m) => m.userId === GUEST)) {
        household.addMember(GUEST);
      }
      return Promise.resolve();
    }),
  };
  const households = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(household),
    findByUserId: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<HouseholdRepository>;
  return { invitations, households };
}

describe('AcceptInvitationUseCase', () => {
  it('accepts, enrolls the member atomically and returns the household', async () => {
    const household = makeHousehold();
    const invitation = makeInvitation(household);
    const { invitations, households } = makeRepos(invitation, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    const result = await useCase.execute({
      token: TOKEN,
      userId: GUEST,
      verifiedEmail: EMAIL,
    });

    expect(invitations.findByTokenHash).toHaveBeenCalledWith(TOKEN_HASH);
    expect(invitations.saveAcceptedWithMembership).toHaveBeenCalledWith(
      invitation,
    );
    expect(invitation.status).toBe('ACCEPTED');
    expect(invitation.acceptedBy).toBe(GUEST);
    expect(result.id).toBe(household.id);
    expect(result.members.some((m) => m.userId === GUEST)).toBe(true);
  });

  it('is idempotent when the user is already a member of the household', async () => {
    const household = makeHousehold();
    household.addMember(GUEST);
    const invitation = makeInvitation(household);
    const { invitations, households } = makeRepos(invitation, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    const result = await useCase.execute({
      token: TOKEN,
      userId: GUEST,
      verifiedEmail: EMAIL,
    });

    expect(invitation.status).toBe('ACCEPTED');
    expect(result.members.filter((m) => m.userId === GUEST)).toHaveLength(1);
  });

  it('rejects an unknown token (404)', async () => {
    const household = makeHousehold();
    const { invitations, households } = makeRepos(null, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    await expect(
      useCase.execute({ token: 'bad', userId: GUEST, verifiedEmail: EMAIL }),
    ).rejects.toBeInstanceOf(InvitationNotFoundError);
  });

  it('rejects a wrong signed-in email (403) without persisting anything', async () => {
    const household = makeHousehold();
    const invitation = makeInvitation(household);
    const { invitations, households } = makeRepos(invitation, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    await expect(
      useCase.execute({
        token: TOKEN,
        userId: 'user-intruder',
        verifiedEmail: 'intruder@example.com',
      }),
    ).rejects.toBeInstanceOf(InvitationEmailMismatchError);

    expect(invitations.saveAcceptedWithMembership).not.toHaveBeenCalled();
    expect(invitation.status).toBe('PENDING');
  });

  it('rejects an already decided invitation (409)', async () => {
    const household = makeHousehold();
    const invitation = makeInvitation(household);
    invitation.revoke();
    const { invitations, households } = makeRepos(invitation, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    await expect(
      useCase.execute({ token: TOKEN, userId: GUEST, verifiedEmail: EMAIL }),
    ).rejects.toBeInstanceOf(InvitationNotPendingError);
  });

  it('rejects an expired invitation (410)', async () => {
    const household = makeHousehold();
    const invitation = Invitation.fromSnapshot({
      ...makeInvitation(household).toSnapshot(),
      expiresAt: new Date(Date.now() - 1000),
    });
    const { invitations, households } = makeRepos(invitation, household);
    const useCase = new AcceptInvitationUseCase(
      invitations,
      tokens,
      households,
    );

    await expect(
      useCase.execute({ token: TOKEN, userId: GUEST, verifiedEmail: EMAIL }),
    ).rejects.toBeInstanceOf(InvitationExpiredError);
  });
});
