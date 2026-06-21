import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';
import {
  EmailAlreadyTakenError,
  UserNotFoundError,
} from '../domain/user.errors';
import type { UserRepository } from '../domain/user.repository';
import { UpdateUserUseCase } from './update-user.use-case';

const makeUser = (id: string, email: string): User =>
  User.fromSnapshot({
    id,
    email,
    firstName: 'Old',
    lastName: 'Name',
    googleId: null,
    passwordHash: 'h',
    role: Role.create('USER'),
    createdAt: new Date('2020-01-01T00:00:00Z'),
    updatedAt: new Date('2020-01-01T00:00:00Z'),
  });

describe('UpdateUserUseCase', () => {
  let repo: jest.Mocked<UserRepository>;
  let useCase: UpdateUserUseCase;
  let existing: User;

  beforeEach(() => {
    existing = makeUser('u1', 'old@example.com');
    repo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(existing),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByGoogleId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new UpdateUserUseCase(repo);
  });

  it('throws when the user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'missing' })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('applies profile changes and persists the same entity', async () => {
    const result = await useCase.execute({ id: 'u1', firstName: 'New' });

    expect(result.firstName).toBe('New');
    expect(repo.save).toHaveBeenCalledWith(existing);
  });

  it('allows changing the email to an unused one', async () => {
    const result = await useCase.execute({
      id: 'u1',
      email: 'new@example.com',
    });

    expect(result.email).toBe('new@example.com');
    expect(repo.save).toHaveBeenCalled();
  });

  it('rejects an email already used by another user', async () => {
    repo.findByEmail.mockResolvedValue(makeUser('u2', 'taken@example.com'));

    await expect(
      useCase.execute({ id: 'u1', email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not look up the email when it is unchanged', async () => {
    await useCase.execute({ id: 'u1', email: 'old@example.com' });

    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
