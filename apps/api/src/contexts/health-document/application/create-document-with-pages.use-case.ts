import { Inject, Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HealthDocument } from '../domain/health-document.entity';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { buildPageFileName } from './file-name';
import {
  deleteStoredFilesBestEffort,
  uploadPagesInOrder,
  type PageContent,
} from './page-upload';

export interface CreateDocumentWithPagesCommand {
  petId: string;
  householdId: string;
  /** Authenticated user — owner of the storage account receiving the files. */
  userId: string;
  documentType: string;
  title: string;
  documentDate: Date;
  tags: string[];
  /** Ordered pages; the array order becomes the pages' positions (1..N). */
  pages: PageContent[];
}

/**
 * Creates a multi-page document from a single batch of scans. Metadata is
 * validated up front so an invalid request never triggers a (costly) upload,
 * then the Drive-then-DB sequence runs:
 *   1. upload all N images to storage, in order;
 *   2. persist the document + its N pages in one DB transaction;
 *   3. if the transaction fails after the uploads succeeded, best-effort delete
 *      the just-uploaded files (orphan cleanup) before surfacing the error.
 * Drive lives outside the transactional boundary, so this staged, best-effort
 * approach is deliberate (see `page-upload.ts`).
 */
@Injectable()
export class CreateDocumentWithPagesUseCase {
  private readonly logger = new Logger(CreateDocumentWithPagesUseCase.name);

  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
  ) {}

  async execute(
    command: CreateDocumentWithPagesCommand,
  ): Promise<HealthDocument> {
    HealthDocument.validateMetadata({
      documentType: command.documentType,
      title: command.title,
      documentDate: command.documentDate,
      tags: command.tags,
    });
    if (command.pages.length === 0) {
      throw new Error('A document must have at least one page.');
    }

    // 1. Upload every page first (cleans up its own batch if it aborts).
    const totalPages = command.pages.length;
    const uploaded = await uploadPagesInOrder(
      this.storage,
      {
        ownerUserId: command.userId,
        petId: command.petId,
        fileName: (position, page) =>
          buildPageFileName(command, page.mimeType, position, totalPages),
      },
      command.pages,
      1,
    );

    const document = HealthDocument.create({
      petId: command.petId,
      householdId: command.householdId,
      uploaderUserId: command.userId,
      documentType: command.documentType,
      title: command.title,
      documentDate: command.documentDate,
      tags: command.tags,
      pages: uploaded,
    });

    // 2. Persist metadata + pages atomically. 3. On failure, the uploaded
    // files would be orphans with no record pointing at them → best-effort
    // delete them before rethrowing.
    try {
      await this.documents.save(document);
    } catch (error) {
      await deleteStoredFilesBestEffort(
        this.storage,
        command.userId,
        uploaded.map((page) => page.storageFileId),
        this.logger,
      );
      throw error;
    }
    return document;
  }
}
