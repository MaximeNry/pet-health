import type {
  DocumentPage as PrismaDocumentPage,
  DocumentType as PrismaDocumentType,
  HealthDocument as PrismaHealthDocument,
} from '../../../../generated/prisma/client';
import { HealthDocument } from '../domain/health-document.entity';

/** A document row with its pages eagerly loaded (Prisma `include: { pages }`). */
export type PrismaHealthDocumentWithPages = PrismaHealthDocument & {
  pages: PrismaDocumentPage[];
};

/** Persistence-ready shape of a document and its pages. */
export interface HealthDocumentPersistence {
  document: {
    id: string;
    petId: string;
    householdId: string;
    uploaderUserId: string;
    documentType: PrismaDocumentType;
    title: string;
    documentDate: Date;
    tags: string[];
  };
  pages: {
    id: string;
    documentId: string;
    position: number;
    driveFileId: string;
    mimeType: string;
    sizeBytes: number;
  }[];
}

/**
 * Translates between the (anemic) Prisma models and the rich domain
 * aggregate. Only the infrastructure knows Prisma: the domain stays pure. The
 * domain's storage-agnostic `storageFileId` maps to the `driveFileId` column.
 */
export class HealthDocumentMapper {
  /** Prisma model (with pages) → rebuilt domain aggregate. */
  static toDomain(record: PrismaHealthDocumentWithPages): HealthDocument {
    return HealthDocument.fromSnapshot({
      id: record.id,
      petId: record.petId,
      householdId: record.householdId,
      uploaderUserId: record.uploaderUserId,
      documentType: record.documentType,
      title: record.title,
      documentDate: record.documentDate,
      tags: record.tags,
      pages: record.pages.map((page) => ({
        id: page.id,
        position: page.position,
        storageFileId: page.driveFileId,
        mimeType: page.mimeType,
        sizeBytes: page.sizeBytes,
        createdAt: page.createdAt,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Domain aggregate → data ready to persist (without DB-managed timestamps). */
  static toPersistence(document: HealthDocument): HealthDocumentPersistence {
    const snapshot = document.toSnapshot();
    return {
      document: {
        id: snapshot.id,
        petId: snapshot.petId,
        householdId: snapshot.householdId,
        uploaderUserId: snapshot.uploaderUserId,
        // The domain already guarantees a valid type (DocumentType value object).
        documentType: snapshot.documentType as PrismaDocumentType,
        title: snapshot.title,
        documentDate: snapshot.documentDate,
        tags: snapshot.tags,
      },
      pages: snapshot.pages.map((page) => ({
        id: page.id,
        documentId: snapshot.id,
        position: page.position,
        driveFileId: page.storageFileId,
        mimeType: page.mimeType,
        sizeBytes: page.sizeBytes,
      })),
    };
  }
}
