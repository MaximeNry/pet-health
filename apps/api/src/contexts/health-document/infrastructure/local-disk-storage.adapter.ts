import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import type {
  DocumentStorage,
  StoredFile,
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
}
