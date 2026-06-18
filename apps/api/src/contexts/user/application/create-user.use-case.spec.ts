import type { PasswordHasher } from '../domain/password-hasher.port';
import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';
import {
  EmailAlreadyTakenError,
  InvalidUserError,
} from '../domain/user.errors';
import type { UserRepository } from '../domain/user.repository';
import { CreateUserCommand, CreateUserUseCase } from './create-user.use-case';

const command = (): CreateUserCommand => ({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'supersecret',
  confirmPassword: 'supersecret',
});

describe('CreateUserUseCase', () => {
  let repo: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    hasher = {
      hash: jest.fn().mockResolvedValue('hashed-pw'),
      verify: jest.fn(),
    };
    useCase = new CreateUserUseCase(repo, hasher);
  });

  it('hashes the password and persists the hash, never the plaintext', async () => {
    const user = await useCase.execute(command());

    expect(hasher.hash).toHaveBeenCalledWith('supersecret');
    const saved = repo.save.mock.calls[0][0];
    expect(saved.toSnapshot().passwordHash).toBe('hashed-pw');
    expect(user.email).toBe('jane@example.com');
    expect(user.role.toString()).toBe('USER');
  });

  it('rejects a confirmation mismatch without hashing or saving', async () => {
    await expect(
      useCase.execute({ ...command(), confirmPassword: 'different' }),
    ).rejects.toBeInstanceOf(InvalidUserError);

    expect(hasher.hash).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('validates the password before touching the repository or hasher', async () => {
    await expect(
      useCase.execute({
        ...command(),
        password: 'short',
        confirmPassword: 'short',
      }),
    ).rejects.toBeInstanceOf(InvalidUserError);

    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email with a conflict and does not hash/save', async () => {
    const existing = User.create({
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      passwordHash: 'h',
      role: Role.create('USER'),
    });
    repo.findByEmail.mockResolvedValue(existing);

    await expect(useCase.execute(command())).rejects.toBeInstanceOf(
      EmailAlreadyTakenError,
    );

    expect(hasher.hash).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
