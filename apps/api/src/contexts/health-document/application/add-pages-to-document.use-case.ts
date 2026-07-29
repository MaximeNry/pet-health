import { Inject, Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HealthDocument } from '../domain/health-document.entity';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { buildPageFileName } from './file-name';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';
import {
  deleteStoredFilesBestEffort,
  uploadPagesInOrder,
  type PageContent,
} from './page-upload';

export interface AddPagesToDocumentCommand {
  petId: string;
  documentId: string;
  /** Ordered pages to append after the document's current last page. */
  pages: PageContent[];
}

/**
 * Appends a batch of scanned pages to an existing document. The new files land
 * in the *document's* uploader's storage — never the appending member's — so
 * every page of a document stays in one account and download/delete remain
 * uniform. Same Drive-then-DB sequence as creation (see
 * `CreateDocumentWithPagesUseCase`), for the new files only.
 */
@Injectable()
export class AddPagesToDocumentUseCase {
  private readonly logger = new Logger(AddPagesToDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: AddPagesToDocumentCommand): Promise<HealthDocument> {
    if (command.pages.length === 0) {
      throw new Error('At least one page is required to append.');
    }
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );

    // New pages continue the document's numbering; files go to the document's
    // uploader's Drive, whichever member is appending.
    const startPosition = document.pageCount + 1;
    const totalPages = document.pageCount + command.pages.length;
    const uploaded = await uploadPagesInOrder(
      this.storage,
      {
        ownerUserId: document.uploaderUserId,
        petId: document.petId,
        fileName: (position, page) =>
          buildPageFileName(document, page.mimeType, position, totalPages),
      },
      command.pages,
      startPosition,
    );

    document.appendPages(uploaded);

    // On a DB failure the just-uploaded files would be orphans → clean them up.
    try {
      await this.documents.save(document);
    } catch (error) {
      await deleteStoredFilesBestEffort(
        this.storage,
        document.uploaderUserId,
        uploaded.map((page) => page.storageFileId),
        this.logger,
      );
      throw error;
    }
    return document;
  }
}
