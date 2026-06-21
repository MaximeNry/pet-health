import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';
import { FindOrCreateGoogleUserUseCase } from './find-or-create-google-user.use-case';

const command = () => ({
  googleId: 'google-sub-123',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
});

describe('FindOrCreateGoogleUserUseCase', () => {
  let repo: jest.Mocked<UserRepository>;
  let useCase: FindOrCreateGoogleUserUseCase;

  beforeEach(() => {
    repo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new FindOrCreateGoogleUserUseCase(repo);
  });

  it('returns the existing user without creating one', async () => {
    const existing = User.createFromGoogle(command());
    repo.findByGoogleId.mockResolvedValue(existing);

    const result = await useCase.execute(command());

    expect(result).toBe(existing);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates and persists a Google user on first login', async () => {
    const result = await useCase.execute(command());

    expect(result.googleId).toBe('google-sub-123');
    expect(result.email).toBe('alice@example.com');
    expect(result.role.toString()).toBe('USER');
    // No password for a Google user.
    expect(result.toSnapshot().passwordHash).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(result);
  });
});
