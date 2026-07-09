import { InvalidHealthDocumentError } from './health-document.errors';

/** Document categories handled by the domain. Aligned with the Prisma enum, but without depending on it. */
export const DOCUMENT_TYPES = [
  'VACCINATION',
  'PRESCRIPTION',
  'LAB_RESULT',
  'CERTIFICATE',
  'IDENTIFICATION',
  'SURGERY',
  'OTHER',
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number];

/**
 * Document type value object: encapsulates a valid category. Immutable,
 * compared by value. Validation lives here rather than in the entity
 * (concept cohesion).
 */
export class DocumentType {
  private constructor(private readonly value: DocumentTypeValue) {}

  static create(raw: string): DocumentType {
    if (!DOCUMENT_TYPES.includes(raw as DocumentTypeValue)) {
      throw new InvalidHealthDocumentError(
        `Invalid document type « ${raw} ». Accepted values: ${DOCUMENT_TYPES.join(', ')}.`,
      );
    }
    return new DocumentType(raw as DocumentTypeValue);
  }

  toString(): DocumentTypeValue {
    return this.value;
  }

  equals(other: DocumentType): boolean {
    return this.value === other.value;
  }
}
