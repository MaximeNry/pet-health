/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const DOCUMENT_STORAGE = 'DocumentStorage';

export interface UploadFileParams {
  /** User whose storage receives the file (owner of the Drive account). */
  ownerUserId: string;
  /** Pet the document belongs to — lets adapters organize files per pet. */
  petId: string;
  fileName: string;
  mimeType: string;
  content: Uint8Array;
}

export interface StoredFile {
  /** Opaque identifier of the stored file (e.g. a Drive file id). */
  fileId: string;
}

/**
 * File storage PORT. The domain doesn't know Google Drive exists: an adapter
 * (Drive, local disk, S3...) implements this interface in infrastructure.
 */
export interface DocumentStorage {
  upload(params: UploadFileParams): Promise<StoredFile>;
}
