import { HealthDocument } from '../domain/health-document.entity';
import { InvalidHealthDocumentError } from '../domain/health-document.errors';
import { AddPagesToDocumentUseCase } from './add-pages-to-document.use-case';
import { CreateDocumentWithPagesUseCase } from './create-document-with-pages.use-case';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

describe('CreateDocumentWithPagesUseCase', () => {
  let storage: jest.Mocked<DocumentStorage>;
  let repository: jest.Mocked<HealthDocumentRepository>;
  let useCase: CreateDocumentWithPagesUseCase;

  const command = () => ({
    petId: 'pet-1',
    householdId: 'household-1',
    userId: 'user-1',
    documentType: 'VACCINATION',
    title: 'Rabies booster',
    documentDate: new Date('2026-06-12'),
    tags: ['rabies'],
    pages: [
      { mimeType: 'image/jpeg', content: new Uint8Array([1, 2, 3]) },
      { mimeType: 'image/jpeg', content: new Uint8Array([4, 5]) },
    ],
  });

  beforeEach(() => {
    let counter = 0;
    storage = {
      upload: jest.fn().mockImplementation(() => {
        counter += 1;
        return Promise.resolve({ fileId: `drive-${counter}` });
      }),
      download: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByPetId: jest.fn(),
      deleteById: jest.fn(),
    };
    useCase = new CreateDocumentWithPagesUseCase(storage, repository);
  });

  it('uploads every page in order, then persists the aggregate once', async () => {
    const document = await useCase.execute(command());

    // Drive-then-DB: both uploads happen before the single save.
    expect(storage.upload).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(expect.any(HealthDocument));

    expect(document.pages.map((p) => p.position)).toEqual([1, 2]);
    expect(document.pages.map((p) => p.storageFileId)).toEqual([
      'drive-1',
      'drive-2',
    ]);
    // Multi-page file names carry a "(n of N)" suffix.
    expect(storage.upload.mock.calls[0][0].fileName).toBe(
      '2026-06-12 Rabies booster (1 of 2).jpg',
    );
  });

  it('rejects invalid metadata before uploading anything', async () => {
    await expect(
      useCase.execute({ ...command(), title: '  ' }),
    ).rejects.toThrow(InvalidHealthDocumentError);

    expect(storage.upload).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('cleans up already-uploaded files when a later upload fails', async () => {
    storage.upload
      .mockResolvedValueOnce({ fileId: 'drive-1' })
      .mockRejectedValueOnce(new Error('drive down'));

    await expect(useCase.execute(command())).rejects.toThrow('drive down');

    // The first (successful) upload is rolled back; nothing is persisted.
    expect(storage.delete).toHaveBeenCalledWith({
      ownerUserId: 'user-1',
      fileId: 'drive-1',
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('deletes the just-uploaded files when the DB transaction fails', async () => {
    repository.save.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(command())).rejects.toThrow('db down');

    // Both uploads succeeded, so both orphans are cleaned up best-effort.
    expect(storage.delete).toHaveBeenCalledWith({
      ownerUserId: 'user-1',
      fileId: 'drive-1',
    });
    expect(storage.delete).toHaveBeenCalledWith({
      ownerUserId: 'user-1',
      fileId: 'drive-2',
    });
  });
});

describe('AddPagesToDocumentUseCase', () => {
  let storage: jest.Mocked<DocumentStorage>;
  let repository: jest.Mocked<HealthDocumentRepository>;
  let useCase: AddPagesToDocumentUseCase;

  const existing = () =>
    HealthDocument.fromSnapshot({
      id: 'doc-1',
      petId: 'pet-1',
      householdId: 'household-1',
      uploaderUserId: 'uploader-1',
      documentType: 'VACCINATION',
      title: 'Rabies booster',
      documentDate: new Date('2026-06-12'),
      tags: [],
      pages: [
        {
          id: 'page-1',
          position: 1,
          storageFileId: 'drive-1',
          mimeType: 'image/jpeg',
          sizeBytes: 3,
          createdAt: new Date('2026-06-13'),
        },
      ],
      createdAt: new Date('2026-06-13'),
      updatedAt: new Date('2026-06-13'),
    });

  beforeEach(() => {
    storage = {
      upload: jest.fn().mockResolvedValue({ fileId: 'drive-2' }),
      download: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(existing()),
      findByPetId: jest.fn(),
      deleteById: jest.fn(),
    };
    const getDocument = new GetPetDocumentUseCase(repository);
    useCase = new AddPagesToDocumentUseCase(storage, repository, getDocument);
  });

  it('uploads to the document uploader account and appends at N+1', async () => {
    const document = await useCase.execute({
      petId: 'pet-1',
      documentId: 'doc-1',
      pages: [{ mimeType: 'image/jpeg', content: new Uint8Array([9]) }],
    });

    // Files go to the ORIGINAL uploader's Drive, not the appending member's.
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: 'uploader-1' }),
    );
    expect(document.pageCount).toBe(2);
    expect(document.pages.map((p) => p.position)).toEqual([1, 2]);
    expect(document.pages[1].storageFileId).toBe('drive-2');
    expect(repository.save).toHaveBeenCalledWith(expect.any(HealthDocument));
  });

  it('cleans up the appended file when the DB transaction fails', async () => {
    repository.save.mockRejectedValue(new Error('db down'));

    await expect(
      useCase.execute({
        petId: 'pet-1',
        documentId: 'doc-1',
        pages: [{ mimeType: 'image/jpeg', content: new Uint8Array([9]) }],
      }),
    ).rejects.toThrow('db down');

    expect(storage.delete).toHaveBeenCalledWith({
      ownerUserId: 'uploader-1',
      fileId: 'drive-2',
    });
  });
});
