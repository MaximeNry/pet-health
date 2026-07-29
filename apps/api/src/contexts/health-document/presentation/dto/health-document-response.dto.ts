import { HealthDocument } from '../../domain/health-document.entity';

/** One page of a document as exposed over HTTP. The Drive file id is never
 * exposed — page bytes are proxied through the `/pages/:pageId/content` route. */
export interface DocumentPageResponse {
  id: string;
  position: number;
  mimeType: string;
  sizeBytes: number;
}

/** Health document as exposed over HTTP (dates serialized as ISO strings). */
export interface HealthDocumentResponse {
  id: string;
  petId: string;
  householdId: string;
  documentType: string;
  title: string;
  documentDate: string;
  tags: string[];
  /** Ordered pages (by position, ascending). */
  pages: DocumentPageResponse[];
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
    pages: document.pages.map((page) => ({
      id: page.id,
      position: page.position,
      mimeType: page.mimeType,
      sizeBytes: page.sizeBytes,
    })),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
