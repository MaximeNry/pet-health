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

export interface StoredFileRef {
  /**
   * User whose storage account is used to reach the file. Files live in the
   * uploader's account; the requester's id is passed today, which limits
   * download/delete to files reachable by that account.
   */
  ownerUserId: string;
  fileId: string;
}

/**
 * File storage PORT. The domain doesn't know Google Drive exists: an adapter
 * (Drive, local disk, S3...) implements this interface in infrastructure.
 */
export interface DocumentStorage {
  upload(params: UploadFileParams): Promise<StoredFile>;
  /** Retrieves the raw bytes of a previously uploaded file. */
  download(ref: StoredFileRef): Promise<Uint8Array>;
  /** Permanently removes a stored file. Succeeds if the file is already gone. */
  delete(ref: StoredFileRef): Promise<void>;
}
