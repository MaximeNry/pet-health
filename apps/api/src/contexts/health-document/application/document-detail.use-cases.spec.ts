import { HealthDocument } from '../domain/health-document.entity';
import {
  HealthDocumentNotFoundError,
  InvalidHealthDocumentError,
} from '../domain/health-document.errors';
import { ChangeDocumentTypeUseCase } from './change-document-type.use-case';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import { DownloadDocumentUseCase } from './download-document.use-case';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

/** Use cases behind the document detail screen: get, download, recategorize, delete. */
describe('document detail use cases', () => {
  let storage: jest.Mocked<DocumentStorage>;
  let repository: jest.Mocked<HealthDocumentRepository>;
  let getDocument: GetPetDocumentUseCase;

  const document = () =>
    HealthDocument.fromSnapshot({
      id: 'doc-1',
      petId: 'pet-1',
      householdId: 'household-1',
      storageFileId: 'drive-42',
      documentType: 'VACCINATION',
      title: 'Rabies booster',
      documentDate: new Date('2026-06-12'),
      tags: ['rabies'],
      mimeType: 'application/pdf',
      sizeBytes: 3,
      createdAt: new Date('2026-06-13'),
      updatedAt: new Date('2026-06-13'),
    });

  beforeEach(() => {
    storage = {
      upload: jest.fn(),
      download: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(document()),
      findByPetId: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };
    getDocument = new GetPetDocumentUseCase(repository);
  });

  describe('GetPetDocumentUseCase', () => {
    it('returns the document of the pet', async () => {
      const found = await getDocument.execute('pet-1', 'doc-1');
      expect(found.id).toBe('doc-1');
    });

    it('rejects an unknown document', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(getDocument.execute('pet-1', 'doc-x')).rejects.toThrow(
        HealthDocumentNotFoundError,
      );
    });

    it('rejects a document reached through another pet', async () => {
      await expect(getDocument.execute('pet-2', 'doc-1')).rejects.toThrow(
        HealthDocumentNotFoundError,
      );
    });
  });

  describe('DownloadDocumentUseCase', () => {
    it('reads the stored file of the document', async () => {
      const useCase = new DownloadDocumentUseCase(storage, getDocument);

      const result = await useCase.execute({
        petId: 'pet-1',
        documentId: 'doc-1',
        userId: 'user-1',
      });

      expect(storage.download).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        fileId: 'drive-42',
      });
      expect(result.content).toEqual(new Uint8Array([1, 2, 3]));
      expect(result.document.id).toBe('doc-1');
    });
  });

  describe('ChangeDocumentTypeUseCase', () => {
    it('recategorizes and persists the document', async () => {
      const useCase = new ChangeDocumentTypeUseCase(repository, getDocument);

      const updated = await useCase.execute({
        petId: 'pet-1',
        documentId: 'doc-1',
        documentType: 'SURGERY',
      });

      expect(updated.documentType).toBe('SURGERY');
      expect(repository.save).toHaveBeenCalledWith(expect.any(HealthDocument));
    });

    it('rejects an invalid type without persisting', async () => {
      const useCase = new ChangeDocumentTypeUseCase(repository, getDocument);

      await expect(
        useCase.execute({
          petId: 'pet-1',
          documentId: 'doc-1',
          documentType: 'SELFIE',
        }),
      ).rejects.toThrow(InvalidHealthDocumentError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteDocumentUseCase', () => {
    it('deletes the stored file before the metadata', async () => {
      const useCase = new DeleteDocumentUseCase(
        storage,
        repository,
        getDocument,
      );

      await useCase.execute({
        petId: 'pet-1',
        documentId: 'doc-1',
        userId: 'user-1',
      });

      expect(storage.delete).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        fileId: 'drive-42',
      });
      expect(repository.deleteById).toHaveBeenCalledWith('doc-1');
    });

    it('keeps the metadata when the storage deletion fails', async () => {
      storage.delete.mockRejectedValue(new Error('drive down'));
      const useCase = new DeleteDocumentUseCase(
        storage,
        repository,
        getDocument,
      );

      await expect(
        useCase.execute({ petId: 'pet-1', documentId: 'doc-1', userId: 'u' }),
      ).rejects.toThrow('drive down');
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
