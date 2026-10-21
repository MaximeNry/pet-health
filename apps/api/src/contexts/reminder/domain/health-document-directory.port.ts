/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const HEALTH_DOCUMENT_DIRECTORY = 'ReminderHealthDocumentDirectory';

/**
 * What the reminder context needs to know about a health document: which pet
 * it belongs to, so a reminder only ever links documents of its own pet.
 * Anti-corruption port, like `PetDirectory`: no dependency on the
 * health-document context's module.
 */
export interface HealthDocumentDirectory {
  /** The document's pet id, or `null` when the document does not exist. */
  findPetIdOfDocument(documentId: string): Promise<string | null>;
}
