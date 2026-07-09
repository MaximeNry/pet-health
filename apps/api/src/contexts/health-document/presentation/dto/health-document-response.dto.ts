import { HealthDocument } from '../../domain/health-document.entity';

/** Health document as exposed over HTTP (dates serialized as ISO strings). */
export interface HealthDocumentResponse {
  id: string;
  petId: string;
  householdId: string;
  documentType: string;
  title: string;
  documentDate: string;
  tags: string[];
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export function toHealthDocumentResponse(
  document: HealthDocument,
): HealthDocumentResponse {
  return {
    id: document.id,
    petId: document.petId,
    householdId: document.householdId,
    documentType: document.documentType,
    title: document.title,
    documentDate: document.documentDate.toISOString(),
    tags: document.tags,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
