import { Module } from '@nestjs/common';
import { ListPetDocumentsUseCase } from './application/list-pet-documents.use-case';
import { UploadDocumentUseCase } from './application/upload-document.use-case';
import { DOCUMENT_STORAGE } from './domain/document-storage.port';
import { HEALTH_DOCUMENT_REPOSITORY } from './domain/health-document.repository';
import { GoogleDriveStorageAdapter } from './infrastructure/google-drive-storage.adapter';
import { LocalDiskStorageAdapter } from './infrastructure/local-disk-storage.adapter';
import { PrismaHealthDocumentRepository } from './infrastructure/prisma-health-document.repository';
import { HealthDocumentController } from './presentation/health-document.controller';

/**
 * Which `DocumentStorage` adapter backs the port:
 * - `DOCUMENT_STORAGE=drive|local` picks explicitly;
 * - otherwise Drive in production, local disk in development (so the scan
 *   flow works without a Google refresh token — dev sessions are forged JWTs
 *   that never went through the OAuth consent).
 */
// `||` on purpose: docker compose passes an empty string when unset.
const storageMode =
  process.env.DOCUMENT_STORAGE ||
  (process.env.NODE_ENV === 'production' ? 'drive' : 'local');

/**
 * `health-document` bounded context (core). Ports are bound to their adapters
 * via tokens (TS interfaces don't exist at runtime). `PrismaService` is
 * provided globally by `PrismaModule`.
 */
@Module({
  controllers: [HealthDocumentController],
  providers: [
    UploadDocumentUseCase,
    ListPetDocumentsUseCase,
    {
      provide: HEALTH_DOCUMENT_REPOSITORY,
      useClass: PrismaHealthDocumentRepository,
    },
    {
      provide: DOCUMENT_STORAGE,
      useClass:
        storageMode === 'drive'
          ? GoogleDriveStorageAdapter
          : LocalDiskStorageAdapter,
    },
  ],
})
export class HealthDocumentModule {}
