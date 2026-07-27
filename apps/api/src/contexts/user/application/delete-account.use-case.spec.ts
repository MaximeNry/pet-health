import type {
  DocumentStorage,
  StoredFileRef,
} from '../../health-document/domain/document-storage.port';
import { HealthDocument } from '../../health-document/domain/health-document.entity';
import type { HealthDocumentRepository } from '../../health-document/domain/health-document.repository';
import { Household } from '../../household/domain/household.entity';
import type { HouseholdRepository } from '../../household/domain/household.repository';
import { Pet } from '../../pet/domain/pet.entity';
import type { PetRepository } from '../../pet/domain/pet.repository';
import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import type { UserRepository } from '../domain/user.repository';
import { DeleteAccountUseCase } from './delete-account.use-case';

const makeUser = () =>
  User.create({
    email: 'marie.lefevre@gmail.com',
    firstName: 'Marie',
    lastName: 'Lefèvre',
    passwordHash: 'h',
    role: Role.create('USER'),
  });

const makePet = (householdId: string) =>
  Pet.create({
    name: 'Nala',
    species: 'CAT',
    birthDate: new Date('2020-01-01'),
    householdId,
  });

const makeDocument = (
  petId: string,
  householdId: string,
  uploaderUserId: string,
) =>
  HealthDocument.create({
    petId,
    householdId,
    uploaderUserId,
    storageFileId: 'drive-file-1',
    documentType: 'VACCINATION',
    title: 'Rabies shot',
    documentDate: new Date('2024-01-01'),
    mimeType: 'image/jpeg',
    sizeBytes: 1234,
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
  const pets = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHouseholdId: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  } as jest.Mocked<PetRepository>;
  const documents = {
    save: jest.fn(),
    findById: jest.fn(),
    findByPetId: jest.fn().mockResolvedValue([]),
    deleteById: jest.fn(),
  } as jest.Mocked<HealthDocumentRepository>;
  const storage: jest.Mocked<DocumentStorage> = {
    upload: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
  };
  const useCase = new DeleteAccountUseCase(
    users,
    households,
    pets,
    documents,
    storage,
  );
  return { users, households, pets, documents, storage, useCase };
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

  it('tears down a sole-member household: files, documents, pets, household, user', async () => {
    const { users, households, pets, documents, storage, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Foyer', ownerId: user.id });
    const pet = makePet(household.id);
    const document = makeDocument(pet.id, household.id, user.id);

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);
    pets.findByHouseholdId.mockResolvedValue([pet]);
    documents.findByPetId.mockResolvedValue([document]);

    await useCase.execute(user.id);

    expect(storage.delete).toHaveBeenCalledWith<[StoredFileRef]>({
      ownerUserId: user.id,
      fileId: document.storageFileId,
    });
    expect(documents.deleteById).toHaveBeenCalledWith(document.id);
    expect(pets.delete).toHaveBeenCalledWith(pet.id);
    expect(households.delete).toHaveBeenCalledWith(household.id);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });

  it('still deletes the account when a stored file cannot be removed', async () => {
    const { users, households, pets, documents, storage, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Foyer', ownerId: user.id });
    const pet = makePet(household.id);

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);
    pets.findByHouseholdId.mockResolvedValue([pet]);
    documents.findByPetId.mockResolvedValue([
      makeDocument(pet.id, household.id, user.id),
    ]);
    storage.delete.mockRejectedValue(new Error('token revoked'));

    await useCase.execute(user.id);

    expect(documents.deleteById).toHaveBeenCalled();
    expect(households.delete).toHaveBeenCalledWith(household.id);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });

  it('leaves a shared household after handing ownership to the oldest member', async () => {
    const { users, households, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Foyer', ownerId: user.id });
    household.addMember('user-other');

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);

    await useCase.execute(user.id);

    expect(households.delete).not.toHaveBeenCalled();
    expect(households.save).toHaveBeenCalledWith(household);
    expect(household.members.map((m) => m.userId)).toEqual(['user-other']);
    expect(household.members[0].isOwner()).toBe(true);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });

  it('simply leaves a shared household that keeps another owner', async () => {
    const { users, households, useCase } = makeDeps();
    const user = makeUser();
    const household = Household.create({ name: 'Foyer', ownerId: 'user-boss' });
    household.addMember(user.id);

    users.findById.mockResolvedValue(user);
    households.findByUserId.mockResolvedValue([household]);

    await useCase.execute(user.id);

    expect(households.save).toHaveBeenCalledWith(household);
    expect(household.members.map((m) => m.userId)).toEqual(['user-boss']);
    expect(users.delete).toHaveBeenCalledWith(user.id);
  });
});
