import { Inject, Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';
import { deleteStoredFilesBestEffort } from './page-upload';

export interface DeleteDocumentCommand {
  petId: string;
  documentId: string;
}

/**
 * Deletes a document and all its pages. Every page's stored file is removed
 * first (best-effort — an unreachable file must not block the deletion), then
 * the metadata; the DB cascade drops the page rows with the document. Files
 * that could not be deleted are left as harmless orphans in the uploader's own
 * Drive (see `deleteStoredFilesBestEffort`).
 */
@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

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
    // All pages live in the document uploader's storage account, whoever asks
    // for the deletion.
    await deleteStoredFilesBestEffort(
      this.storage,
      document.uploaderUserId,
      document.pages.map((page) => page.storageFileId),
      this.logger,
    );
    await this.documents.deleteById(document.id);
  }
}
