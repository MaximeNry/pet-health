import { API_URL, ApiError, apiClient } from '@/shared/api/apiClient';
import type { DocumentType, HealthDocument } from '@/entities/document';

/** Metadata + ordered pages for `POST /pets/:petId/documents` (multipart). */
export interface CreateDocumentInput {
  householdId: string;
  documentType: DocumentType;
  title: string;
  /** ISO date (yyyy-mm-dd) of the document itself. */
  documentDate: string;
  tags: string[];
  /** Ordered page images; the array order becomes the pages' positions. */
  files: Blob[];
}

/**
 * Posts a multipart form to `url` with N ordered `file` parts and reports live
 * upload progress. `fetch` cannot observe upload progress, so this drops down
 * to `XMLHttpRequest` — the design's upload screen shows a live percentage.
 */
function postMultipart(
  url: string,
  fields: Record<string, string>,
  files: Blob[],
  onProgress?: (fraction: number) => void,
): Promise<HealthDocument> {
  return new Promise<HealthDocument>((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    // Order matters: the server maps the file parts to page positions in order.
    files.forEach((file, index) => {
      form.append('file', file, `page-${index + 1}.jpg`);
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    // Send the httpOnly session cookie cross-origin, like apiClient does.
    xhr.withCredentials = true;
    xhr.responseType = 'json';

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as HealthDocument);
      } else {
        reject(new ApiError(xhr.status, `Document upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () =>
      reject(new ApiError(0, 'Document upload failed (network error)'));
    xhr.send(form);
  });
}

/** Centralised access to the health-document endpoints. */
export const documentsAdapter = {
  listByPet: (petId: string) =>
    apiClient.get<HealthDocument[]>(
      `/pets/${encodeURIComponent(petId)}/documents`,
    ),

  getById: (petId: string, documentId: string) =>
    apiClient.get<HealthDocument>(
      `/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}`,
    ),

  /** Raw bytes of one page (image or PDF), for preview / download / share. */
  getPageContent: (petId: string, documentId: string, pageId: string) =>
    apiClient.getBlob(
      `/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}/pages/${encodeURIComponent(pageId)}/content`,
    ),

  changeType: (petId: string, documentId: string, documentType: DocumentType) =>
    apiClient.patch<HealthDocument>(
      `/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}`,
      { documentType },
    ),

  remove: (petId: string, documentId: string) =>
    apiClient.delete<void>(
      `/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}`,
    ),

  /** Creates a multi-page document from a single batch of scans. */
  create: (
    petId: string,
    input: CreateDocumentInput,
    onProgress?: (fraction: number) => void,
  ) =>
    postMultipart(
      `${API_URL}/pets/${encodeURIComponent(petId)}/documents`,
      {
        householdId: input.householdId,
        documentType: input.documentType,
        title: input.title,
        documentDate: input.documentDate,
        tags: JSON.stringify(input.tags),
      },
      input.files,
      onProgress,
    ),

  /** Appends ordered pages to an existing document. */
  addPages: (
    petId: string,
    documentId: string,
    files: Blob[],
    onProgress?: (fraction: number) => void,
  ) =>
    postMultipart(
      `${API_URL}/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}/pages`,
      {},
      files,
      onProgress,
    ),
};
