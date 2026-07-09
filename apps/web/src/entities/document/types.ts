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

/** A health document's metadata, as returned by `GET /pets/:petId/documents`. */
export interface HealthDocument {
  id: string;
  petId: string;
  householdId: string;
  documentType: DocumentType;
  title: string;
  documentDate: string;
  tags: string[];
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}
