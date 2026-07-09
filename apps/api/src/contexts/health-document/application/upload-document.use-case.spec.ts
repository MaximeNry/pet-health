import { HealthDocument } from '../domain/health-document.entity';
import { InvalidHealthDocumentError } from '../domain/health-document.errors';
import { UploadDocumentUseCase } from './upload-document.use-case';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

describe('UploadDocumentUseCase', () => {
  let storage: jest.Mocked<DocumentStorage>;
  let repository: jest.Mocked<HealthDocumentRepository>;
  let useCase: UploadDocumentUseCase;

  const command = () => ({
    petId: 'pet-1',
    householdId: 'household-1',
    userId: 'user-1',
    documentType: 'VACCINATION',
    title: 'Rabies booster',
    documentDate: new Date('2026-06-12'),
    tags: ['rabies'],
    mimeType: 'image/jpeg',
    content: new Uint8Array([1, 2, 3]),
  });

  beforeEach(() => {
    storage = {
      upload: jest.fn().mockResolvedValue({ fileId: 'drive-42' }),
      download: jest.fn(),
      delete: jest.fn(),
    };
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByPetId: jest.fn(),
      deleteById: jest.fn(),
    };
    useCase = new UploadDocumentUseCase(storage, repository);
  });

  it('uploads the file then persists the metadata', async () => {
    const document = await useCase.execute(command());

    expect(storage.upload).toHaveBeenCalledWith({
      ownerUserId: 'user-1',
      petId: 'pet-1',
      fileName: '2026-06-12 Rabies booster.jpg',
      mimeType: 'image/jpeg',
      content: new Uint8Array([1, 2, 3]),
    });
    expect(repository.save).toHaveBeenCalledWith(expect.any(HealthDocument));
    expect(document.storageFileId).toBe('drive-42');
    expect(document.sizeBytes).toBe(3);
  });

  it('rejects invalid metadata before uploading anything', async () => {
    await expect(
      useCase.execute({ ...command(), title: '  ' }),
    ).rejects.toThrow(InvalidHealthDocumentError);

    expect(storage.upload).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not persist metadata when the storage upload fails', async () => {
    storage.upload.mockRejectedValue(new Error('drive down'));

    await expect(useCase.execute(command())).rejects.toThrow('drive down');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
