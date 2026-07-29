import { Logger } from '@nestjs/common';
import type { DocumentStorage } from '../domain/document-storage.port';
import type { NewPageData } from '../domain/document-page.entity';

/** One page to upload: its bytes and mime type, in the caller's page order. */
export interface PageContent {
  mimeType: string;
  content: Uint8Array;
}

/** Context needed to name and route the uploaded files. */
export interface UploadContext {
  /** Storage account that receives every file (the document's uploader). */
  ownerUserId: string;
  petId: string;
  /** Builds a file name for the page at the given 1-based position. */
  fileName: (position: number, page: PageContent) => string;
}

/**
 * Google Drive lives OUTSIDE the DB transactional boundary — we cannot wrap
 * the uploads and the metadata write in one ACID transaction. So the uploads
 * run first: all pages are pushed to storage in order, collecting their file
 * ids. If any upload fails mid-batch, the files already uploaded in this batch
 * are deleted (best-effort) before the error surfaces, so a half-written batch
 * leaves nothing behind.
 *
 * `startPosition` is the position of the first page in this batch (1 when
 * creating a document, N+1 when appending to one).
 */
export async function uploadPagesInOrder(
  storage: DocumentStorage,
  context: UploadContext,
  pages: PageContent[],
  startPosition: number,
): Promise<NewPageData[]> {
  const uploaded: NewPageData[] = [];
  try {
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const { fileId } = await storage.upload({
        ownerUserId: context.ownerUserId,
        petId: context.petId,
        fileName: context.fileName(startPosition + index, page),
        mimeType: page.mimeType,
        content: page.content,
      });
      uploaded.push({
        storageFileId: fileId,
        mimeType: page.mimeType,
        sizeBytes: page.content.byteLength,
      });
    }
    return uploaded;
  } catch (error) {
    // Abort mid-batch: clean up what this batch already uploaded, then rethrow.
    await deleteStoredFilesBestEffort(
      storage,
      context.ownerUserId,
      uploaded.map((page) => page.storageFileId),
    );
    throw error;
  }
}

/**
 * Deletes stored files, swallowing per-file errors. Used for orphan cleanup
 * after a failure and for the document-deletion flow. Orphaned Drive files are
 * cosmetic at this scale (they sit in the uploader's own Drive, removable by
 * hand), so best-effort cleanup is intentional and sufficient — no saga,
 * outbox or 2-phase commit for something outside the transactional boundary.
 */
export async function deleteStoredFilesBestEffort(
  storage: DocumentStorage,
  ownerUserId: string,
  fileIds: string[],
  logger?: Logger,
): Promise<void> {
  for (const fileId of fileIds) {
    try {
      await storage.delete({ ownerUserId, fileId });
    } catch (error) {
      logger?.warn(`Could not delete stored file ${fileId}: ${String(error)}`);
    }
  }
}
