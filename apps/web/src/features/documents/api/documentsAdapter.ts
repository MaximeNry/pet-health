import { API_URL, ApiError, apiClient } from '@/shared/api/apiClient';
import type { DocumentType, HealthDocument } from '@/entities/document';

/** Payload for `POST /pets/:petId/documents` (multipart). */
export interface UploadDocumentInput {
  householdId: string;
  documentType: DocumentType;
  title: string;
  /** ISO date (yyyy-mm-dd) of the document itself. */
  documentDate: string;
  tags: string[];
  file: Blob;
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

  /** Raw file bytes (image or PDF), for the preview / download / share. */
  getContent: (petId: string, documentId: string) =>
    apiClient.getBlob(
      `/pets/${encodeURIComponent(petId)}/documents/${encodeURIComponent(documentId)}/content`,
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

  /**
   * Multipart upload with progress reporting. `fetch` (and thus `apiClient`)
   * cannot observe upload progress, so this one call drops down to
   * `XMLHttpRequest` — the design's upload screen shows a live percentage.
   */
  upload: (
    petId: string,
    input: UploadDocumentInput,
    onProgress?: (fraction: number) => void,
  ) =>
    new Promise<HealthDocument>((resolve, reject) => {
      const form = new FormData();
      form.append('householdId', input.householdId);
      form.append('documentType', input.documentType);
      form.append('title', input.title);
      form.append('documentDate', input.documentDate);
      form.append('tags', JSON.stringify(input.tags));
      form.append('file', input.file, 'scan.jpg');

      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${API_URL}/pets/${encodeURIComponent(petId)}/documents`,
      );
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
          reject(
            new ApiError(xhr.status, `Document upload failed (${xhr.status})`),
          );
        }
      };
      xhr.onerror = () =>
        reject(new ApiError(0, 'Document upload failed (network error)'));
      xhr.send(form);
    }),
};
