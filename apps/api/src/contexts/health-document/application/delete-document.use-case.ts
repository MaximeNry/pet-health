import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';

export interface DeleteDocumentCommand {
  petId: string;
  documentId: string;
}

/**
 * Deletes a document: the stored file first, then the metadata. If the
 * storage deletion fails the metadata is kept, so the document stays visible
 * and the user can retry — the opposite order could leak an orphan file with
 * no record pointing at it.
 */
@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: DeleteDocumentCommand): Promise<void> {
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );
    // The file lives in the uploader's storage account, whatever member asks
    // for the deletion.
    await this.storage.delete({
      ownerUserId: document.uploaderUserId,
      fileId: document.storageFileId,
    });
    await this.documents.deleteById(document.id);
  }
}
