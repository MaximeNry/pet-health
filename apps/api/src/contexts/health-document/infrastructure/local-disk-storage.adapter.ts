import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { HealthDocumentNotFoundError } from '../domain/health-document.errors';
import type {
  DocumentStorage,
  StoredFile,
  StoredFileRef,
  UploadFileParams,
} from '../domain/document-storage.port';

/**
 * Local-disk adapter for the `DocumentStorage` port — the development
 * fallback (see `DOCUMENT_STORAGE` in the module): it lets the whole scan
 * flow run without a Google account wired up. Files land in
 * `DOCUMENT_STORAGE_DIR` (container-local, not a mounted volume: they don't
 * survive an image rebuild, which is fine for dev data).
 */
@Injectable()
export class LocalDiskStorageAdapter implements DocumentStorage {
  private readonly logger = new Logger(LocalDiskStorageAdapter.name);

  private readonly baseDir =
    process.env.DOCUMENT_STORAGE_DIR ?? '/tmp/pethealth-documents';

  async upload(params: UploadFileParams): Promise<StoredFile> {
    const dir = join(this.baseDir, params.petId);
    await mkdir(dir, { recursive: true });

    const fileId = `${params.petId}/${randomUUID()}-${params.fileName}`;
    await writeFile(join(this.baseDir, fileId), params.content);
    this.logger.log(`Stored document on local disk: ${fileId}`);
    return { fileId };
  }

  async download(ref: StoredFileRef): Promise<Uint8Array> {
    try {
      return await readFile(this.resolvePath(ref.fileId));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new HealthDocumentNotFoundError(ref.fileId);
      }
      throw error;
    }
  }

  async delete(ref: StoredFileRef): Promise<void> {
    // `force` swallows ENOENT: deleting an already-gone file must succeed.
    await rm(this.resolvePath(ref.fileId), { force: true });
    this.logger.log(`Deleted document from local disk: ${ref.fileId}`);
  }

  /** Local file ids embed a path segment — refuse anything escaping baseDir. */
  private resolvePath(fileId: string): string {
    const path = normalize(join(this.baseDir, fileId));
    if (!path.startsWith(this.baseDir + sep)) {
      throw new HealthDocumentNotFoundError(fileId);
    }
    return path;
  }
}
