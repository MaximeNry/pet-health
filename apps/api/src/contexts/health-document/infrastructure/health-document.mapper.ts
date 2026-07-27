import type {
  DocumentType as PrismaDocumentType,
  HealthDocument as PrismaHealthDocument,
} from '../../../../generated/prisma/client';
import { HealthDocument } from '../domain/health-document.entity';

/**
 * Translates between the (anemic) Prisma model and the rich domain entity.
 * Only the infrastructure knows Prisma: the domain stays pure. The domain's
 * storage-agnostic `storageFileId` maps to the `driveFileId` column.
 */
export class HealthDocumentMapper {
  /** Prisma model → rebuilt domain entity. */
  static toDomain(record: PrismaHealthDocument): HealthDocument {
    return HealthDocument.fromSnapshot({
      id: record.id,
      petId: record.petId,
      householdId: record.householdId,
      storageFileId: record.driveFileId,
      uploaderUserId: record.uploaderUserId,
      documentType: record.documentType,
      title: record.title,
      documentDate: record.documentDate,
      tags: record.tags,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Domain entity → data ready to persist (without DB-managed timestamps). */
  static toPersistence(document: HealthDocument) {
    const snapshot = document.toSnapshot();
    return {
      id: snapshot.id,
      petId: snapshot.petId,
      householdId: snapshot.householdId,
      driveFileId: snapshot.storageFileId,
      uploaderUserId: snapshot.uploaderUserId,
      // The domain already guarantees a valid type (DocumentType value object).
      documentType: snapshot.documentType as PrismaDocumentType,
      title: snapshot.title,
      documentDate: snapshot.documentDate,
      tags: snapshot.tags,
      mimeType: snapshot.mimeType,
      sizeBytes: snapshot.sizeBytes,
    };
  }
}
