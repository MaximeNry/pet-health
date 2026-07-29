/** Domain document categories, aligned with the API's `DocumentType` value object. */
export type DocumentType =
  | 'VACCINATION'
  | 'PRESCRIPTION'
  | 'LAB_RESULT'
  | 'CERTIFICATE'
  | 'IDENTIFICATION'
  | 'SURGERY'
  | 'OTHER';

export const DOCUMENT_TYPES: DocumentType[] = [
  'VACCINATION',
  'PRESCRIPTION',
  'LAB_RESULT',
  'CERTIFICATE',
  'IDENTIFICATION',
  'SURGERY',
  'OTHER',
];

/** One page of a document: a single scanned file. Ordered by `position`. */
export interface DocumentPage {
  id: string;
  position: number;
  mimeType: string;
  sizeBytes: number;
}

/** A health document's metadata, as returned by `GET /pets/:petId/documents`. */
export interface HealthDocument {
  id: string;
  petId: string;
  householdId: string;
  documentType: DocumentType;
  title: string;
  documentDate: string;
  tags: string[];
  /** Ordered pages (by position, ascending); a document always has ≥ 1. */
  pages: DocumentPage[];
  createdAt: string;
  updatedAt: string;
}
