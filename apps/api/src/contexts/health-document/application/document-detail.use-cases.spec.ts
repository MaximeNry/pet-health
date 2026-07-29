import { HealthDocument } from '../domain/health-document.entity';
import {
  DocumentPageNotFoundError,
  HealthDocumentNotFoundError,
  InvalidHealthDocumentError,
} from '../domain/health-document.errors';
import { ChangeDocumentTypeUseCase } from './change-document-type.use-case';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import { DownloadPageUseCase } from './download-page.use-case';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

/** Use cases behind the document detail screen: get, download page, recategorize, delete. */
describe('document detail use cases', () => {
  let storage: jest.Mocked<DocumentStorage>;
  let repository: jest.Mocked<HealthDocumentRepository>;
  let getDocument: GetPetDocumentUseCase;

  const document = () =>
    HealthDocument.fromSnapshot({
      id: 'doc-1',
      petId: 'pet-1',
      householdId: 'household-1',
      uploaderUserId: 'uploader-1',
      documentType: 'VACCINATION',
      title: 'Rabies booster',
      documentDate: new Date('2026-06-12'),
      tags: ['rabies'],
      pages: [
        {
          id: 'page-1',
          position: 1,
          storageFileId: 'drive-42',
          mimeType: 'application/pdf',
          sizeBytes: 3,
          createdAt: new Date('2026-06-13'),
        },
        {
          id: 'page-2',
          position: 2,
          storageFileId: 'drive-43',
          mimeType: 'image/jpeg',
          sizeBytes: 5,
          createdAt: new Date('2026-06-13'),
        },
      ],
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
    it('returns the document of the pet with its ordered pages', async () => {
      const found = await getDocument.execute('pet-1', 'doc-1');
      expect(found.id).toBe('doc-1');
      expect(found.pages.map((p) => p.position)).toEqual([1, 2]);
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

  describe('DownloadPageUseCase', () => {
    it('reads a page with the uploader account, whoever asks', async () => {
      const useCase = new DownloadPageUseCase(storage, getDocument);

      const result = await useCase.execute({
        petId: 'pet-1',
        documentId: 'doc-1',
        pageId: 'page-2',
      });

      expect(storage.download).toHaveBeenCalledWith({
        ownerUserId: 'uploader-1',
        fileId: 'drive-43',
      });
      expect(result.content).toEqual(new Uint8Array([1, 2, 3]));
      expect(result.page.id).toBe('page-2');
    });

    it('rejects a page that does not belong to the document', async () => {
      const useCase = new DownloadPageUseCase(storage, getDocument);
      await expect(
        useCase.execute({
          petId: 'pet-1',
          documentId: 'doc-1',
          pageId: 'page-x',
        }),
      ).rejects.toThrow(DocumentPageNotFoundError);
      expect(storage.download).not.toHaveBeenCalled();
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
    it('best-effort deletes every page file before the metadata', async () => {
      const useCase = new DeleteDocumentUseCase(
        storage,
        repository,
        getDocument,
      );

      await useCase.execute({ petId: 'pet-1', documentId: 'doc-1' });

      expect(storage.delete).toHaveBeenCalledWith({
        ownerUserId: 'uploader-1',
        fileId: 'drive-42',
      });
      expect(storage.delete).toHaveBeenCalledWith({
        ownerUserId: 'uploader-1',
        fileId: 'drive-43',
      });
      expect(repository.deleteById).toHaveBeenCalledWith('doc-1');
    });

    it('still removes the metadata when a page file cannot be deleted', async () => {
      storage.delete.mockRejectedValue(new Error('drive down'));
      const useCase = new DeleteDocumentUseCase(
        storage,
        repository,
        getDocument,
      );

      await useCase.execute({ petId: 'pet-1', documentId: 'doc-1' });
      expect(repository.deleteById).toHaveBeenCalledWith('doc-1');
    });
  });
});
