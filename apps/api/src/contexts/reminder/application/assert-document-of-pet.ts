import type { HealthDocumentDirectory } from '../domain/health-document-directory.port';
import { ReminderDocumentNotFoundError } from '../domain/reminder.errors';

/**
 * A reminder only links documents of its own pet: otherwise a member could
 * reference (and the UI would try to open) another household's document.
 * `null`/`undefined` (no document) passes.
 */
export async function assertDocumentOfPet(
  documents: HealthDocumentDirectory,
  petId: string,
  documentId: string | null | undefined,
): Promise<void> {
  if (!documentId) {
    return;
  }
  const ownerPetId = await documents.findPetIdOfDocument(documentId);
  if (ownerPetId !== petId) {
    throw new ReminderDocumentNotFoundError(documentId);
  }
}
