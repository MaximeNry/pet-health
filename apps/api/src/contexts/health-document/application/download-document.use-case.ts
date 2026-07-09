import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HealthDocument } from '../domain/health-document.entity';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';

export interface DownloadDocumentCommand {
  petId: string;
  documentId: string;
  /** Authenticated user — whose storage account is used to read the file. */
  userId: string;
}

export interface DownloadedDocument {
  document: HealthDocument;
  content: Uint8Array;
}

/**
 * Retrieves the bytes of a stored document for preview or download: resolves
 * the metadata (guarding pet ownership), then reads the file behind the
 * `DocumentStorage` port.
 */
@Injectable()
export class DownloadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: DownloadDocumentCommand): Promise<DownloadedDocument> {
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );
    const content = await this.storage.download({
      ownerUserId: command.userId,
      fileId: document.storageFileId,
    });
    return { document, content };
  }
}
