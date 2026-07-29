import { Entity } from '../../../shared/domain/entity.base';
import { InvalidHealthDocumentError } from './health-document.errors';

/** Data required to register a newly stored page (before it gets a position). */
export interface NewPageData {
  /** Opaque id of the stored file backing this page (e.g. a Drive file id). */
  storageFileId: string;
  mimeType: string;
  sizeBytes: number;
}

/** Full snapshot of a persisted page, used to rebuild it. */
export interface DocumentPageSnapshot {
  id: string;
  position: number;
  storageFileId: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

/**
 * A single scanned page — one stored file. `DocumentPage` is an entity
 * *internal* to the `HealthDocument` aggregate: it is only ever created or
 * rebuilt through the root, which owns page ordering (`position`). Pages are
 * immutable once created.
 */
export class DocumentPage extends Entity {
  private readonly _position: number;
  private readonly _storageFileId: string;
  private readonly _mimeType: string;
  private readonly _sizeBytes: number;
  private readonly _createdAt: Date;

  private constructor(props: DocumentPageSnapshot) {
    super(props.id);
    this._position = props.position;
    this._storageFileId = props.storageFileId;
    this._mimeType = props.mimeType;
    this._sizeBytes = props.sizeBytes;
    this._createdAt = props.createdAt;
  }

  /**
   * Creates a page at the given position. Called only by the aggregate root,
   * which assigns contiguous positions.
   */
  static create(data: NewPageData, position: number): DocumentPage {
    return new DocumentPage({
      id: globalThis.crypto.randomUUID(),
      position,
      storageFileId: DocumentPage.requireValue(
        data.storageFileId,
        'storageFileId',
      ),
      mimeType: DocumentPage.requireValue(data.mimeType, 'mimeType'),
      sizeBytes: DocumentPage.normalizeSize(data.sizeBytes),
      createdAt: new Date(),
    });
  }

  /** Rebuilds a page from persistence (no id generation). */
  static fromSnapshot(snapshot: DocumentPageSnapshot): DocumentPage {
    return new DocumentPage(snapshot);
  }

  toSnapshot(): DocumentPageSnapshot {
    return {
      id: this.id,
      position: this._position,
      storageFileId: this._storageFileId,
      mimeType: this._mimeType,
      sizeBytes: this._sizeBytes,
      createdAt: this._createdAt,
    };
  }

  get position(): number {
    return this._position;
  }

  get storageFileId(): string {
    return this._storageFileId;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static normalizeSize(sizeBytes: number): number {
    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
      throw new InvalidHealthDocumentError(
        'The page size must be a positive number of bytes.',
      );
    }
    return sizeBytes;
  }

  private static requireValue(value: string, field: string): string {
    if (!value || value.trim().length === 0) {
      throw new InvalidHealthDocumentError(`The « ${field} » is required.`);
    }
    return value;
  }
}
