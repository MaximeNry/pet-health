/**
 * Multipart form fields of `POST /pets/:petId/documents`. The file itself
 * travels in the `file` part; `tags` is a JSON-encoded array of strings
 * (multipart fields are flat text).
 */
export interface UploadDocumentDto {
  householdId: string;
  documentType: string;
  title: string;
  /** ISO date (yyyy-mm-dd) of the document itself, not of the upload. */
  documentDate: string;
  tags?: string;
}
