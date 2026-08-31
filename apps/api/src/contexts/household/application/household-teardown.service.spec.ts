import type {
  DocumentStorage,
  StoredFileRef,
} from '../../health-document/domain/document-storage.port';
import { HealthDocument } from '../../health-document/domain/health-document.entity';
import type { HealthDocumentRepository } from '../../health-document/domain/health-document.repository';
import { Pet } from '../../pet/domain/pet.entity';
import type { PetRepository } from '../../pet/domain/pet.repository';
import type { HouseholdRepository } from '../domain/household.repository';
import { HouseholdTeardownService } from './household-teardown.service';

const HOUSEHOLD_ID = 'household-1';

const makePet = () =>
  Pet.create({
    name: 'Nala',
    species: 'CAT',
    birthDate: new Date('2020-01-01'),
    householdId: HOUSEHOLD_ID,
  });

const makeDocument = (petId: string, uploaderUserId: string) =>
  HealthDocument.create({
    petId,
    householdId: HOUSEHOLD_ID,
    uploaderUserId,
    documentType: 'VACCINATION',
    title: 'Rabies shot',
    documentDate: new Date('2024-01-01'),
    pages: [
      {
        storageFileId: 'drive-file-1',
        mimeType: 'image/jpeg',
        sizeBytes: 1234,
      },
    ],
  });

function makeDeps() {
  const households = {
    save: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
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
  const service = new HouseholdTeardownService(
    households,
    pets,
    documents,
    storage,
  );
  return { households, pets, documents, storage, service };
}

describe('HouseholdTeardownService', () => {
  it('deletes stored files, documents, pets, then the household', async () => {
    const { households, pets, documents, storage, service } = makeDeps();
    const pet = makePet();
    const document = makeDocument(pet.id, 'user-1');

    pets.findByHouseholdId.mockResolvedValue([pet]);
    documents.findByPetId.mockResolvedValue([document]);

    await service.execute(HOUSEHOLD_ID);

    expect(storage.delete).toHaveBeenCalledWith<[StoredFileRef]>({
      ownerUserId: 'user-1',
      fileId: document.pages[0].storageFileId,
    });
    expect(documents.deleteById).toHaveBeenCalledWith(document.id);
    expect(pets.delete).toHaveBeenCalledWith(pet.id);
    expect(households.delete).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });

  it('still tears the household down when a stored file cannot be removed', async () => {
    const { households, pets, documents, storage, service } = makeDeps();
    const pet = makePet();

    pets.findByHouseholdId.mockResolvedValue([pet]);
    documents.findByPetId.mockResolvedValue([makeDocument(pet.id, 'user-1')]);
    storage.delete.mockRejectedValue(new Error('token revoked'));

    await service.execute(HOUSEHOLD_ID);

    expect(documents.deleteById).toHaveBeenCalled();
    expect(pets.delete).toHaveBeenCalledWith(pet.id);
    expect(households.delete).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });

  it('deletes an empty household directly', async () => {
    const { households, pets, storage, service } = makeDeps();

    await service.execute(HOUSEHOLD_ID);

    expect(pets.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
    expect(households.delete).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });
});
