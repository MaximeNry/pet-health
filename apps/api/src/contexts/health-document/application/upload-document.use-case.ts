import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_STORAGE } from '../domain/document-storage.port';
import type { DocumentStorage } from '../domain/document-storage.port';
import { HealthDocument } from '../domain/health-document.entity';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

export interface UploadDocumentCommand {
  petId: string;
  householdId: string;
  /** Authenticated user — owner of the storage account receiving the file. */
  userId: string;
  documentType: string;
  title: string;
  documentDate: Date;
  tags: string[];
  mimeType: string;
  content: Uint8Array;
}

/** File extension by accepted mime type, for a readable stored file name. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Uploads a scanned document: stores the bytes behind the `DocumentStorage`
 * port, then persists the metadata. Metadata is validated up front so an
 * invalid request never triggers a (costly) remote upload; if persisting
 * fails afterwards, the worst case is an orphan file in storage.
 */
@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStorage,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
  ) {}

  async execute(command: UploadDocumentCommand): Promise<HealthDocument> {
    HealthDocument.validateMetadata({
      documentType: command.documentType,
      title: command.title,
      documentDate: command.documentDate,
      tags: command.tags,
    });

    const { fileId } = await this.storage.upload({
      ownerUserId: command.userId,
      petId: command.petId,
      fileName: this.buildFileName(command),
      mimeType: command.mimeType,
      content: command.content,
    });

    const document = HealthDocument.create({
      petId: command.petId,
      householdId: command.householdId,
      storageFileId: fileId,
      documentType: command.documentType,
      title: command.title,
      documentDate: command.documentDate,
      tags: command.tags,
      mimeType: command.mimeType,
      sizeBytes: command.content.byteLength,
    });
    await this.documents.save(document);
    return document;
  }

  /** e.g. "2026-06-12 Rabies booster.jpg" — sortable and human-readable. */
  private buildFileName(command: UploadDocumentCommand): string {
    const date = command.documentDate.toISOString().slice(0, 10);
    const extension = EXTENSION_BY_MIME[command.mimeType] ?? 'bin';
    // Strip characters that are risky in file names across storages.
    const safeTitle = command.title.trim().replace(/[\\/:*?"<>|]/g, ' ');
    return `${date} ${safeTitle}.${extension}`;
  }
}
