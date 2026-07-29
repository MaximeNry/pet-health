import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { DocumentPage } from '../domain/document-page.entity';
import { HealthDocument } from '../domain/health-document.entity';
import { DocumentPageNotFoundError } from '../domain/health-document.errors';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';

export interface DownloadPageCommand {
  petId: string;
  documentId: string;
  pageId: string;
}

export interface DownloadedPage {
  document: HealthDocument;
  page: DocumentPage;
  content: Uint8Array;
}

/**
 * Retrieves the bytes of one page for preview or download: resolves the
 * document (guarding pet ownership), locates the page within the aggregate,
 * then reads its file behind the `DocumentStorage` port. The file is read with
 * the document's *uploader* account (every page of a document lives in that
 * member's Drive), so every household member can view every page.
 */
@Injectable()
export class DownloadPageUseCase {
  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: DownloadPageCommand): Promise<DownloadedPage> {
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );
    const page = document.findPage(command.pageId);
    if (!page) {
      throw new DocumentPageNotFoundError(command.pageId);
    }
    const content = await this.storage.download({
      ownerUserId: document.uploaderUserId,
      fileId: page.storageFileId,
    });
    return { document, page, content };
  }
}
