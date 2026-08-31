import type { HouseholdTeardownService } from '../../household/application/household-teardown.service';
import { Household } from '../../household/domain/household.entity';
import type { HouseholdRepository } from '../../household/domain/household.repository';
import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import type { UserRepository } from '../domain/user.repository';
import { DeleteAccountUseCase } from './delete-account.use-case';

const makeUser = () =>
  User.create({
    email: 'marie.lefevre@example.com',
    firstName: 'Marie',
    lastName: 'Lefevre',
    passwordHash: 'h',
    role: Role.create('USER'),
  });

function makeDeps() {
  const users = {
    save: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByGoogleId: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<UserRepository>;
  const households = {
    save: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  } as jest.Mocked<HouseholdRepository>;
  const teardown = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<HouseholdTeardownService>;
  const useCase = new DeleteAccountUseCase(users, households, teardown);
  return { users, households, teardown, useCase };
}

describe('DeleteAccountUseCase', () => {
  it('rejects an unknown user', async () => {
    const { users, useCase } = makeDeps();
    users.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(users.delete).not.toHaveBeenCalled();
  });

  it('tears down a sole-member household, then deletes the user', async () => {
    const { users, households, teardown, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Household', ownerId: user.id });

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);

    await useCase.execute(user.id);

    expect(teardown.execute).toHaveBeenCalledWith(household.id);
    expect(households.delete).not.toHaveBeenCalled(); // teardown owns the delete
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });

  it('leaves a shared household after handing ownership to the oldest member', async () => {
    const { users, households, teardown, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Household', ownerId: user.id });
    household.addMember('user-other');

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);

    await useCase.execute(user.id);

    expect(teardown.execute).not.toHaveBeenCalled();
    expect(households.save).toHaveBeenCalledWith(household);
    expect(household.members.map((m) => m.userId)).toEqual(['user-other']);
    expect(household.members[0].isOwner()).toBe(true);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });

  it('simply leaves a shared household that keeps another owner', async () => {
    const { users, households, teardown, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({
      name: 'Household',
      ownerId: 'user-boss',
    });
    household.addMember(user.id);

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);

    await useCase.execute(user.id);

    expect(teardown.execute).not.toHaveBeenCalled();
    expect(households.save).toHaveBeenCalledWith(household);
    expect(household.members.map((m) => m.userId)).toEqual(['user-boss']);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });
});
