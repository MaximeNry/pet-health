import { HealthDocument } from './health-document.entity';

/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const HEALTH_DOCUMENT_REPOSITORY = 'HealthDocumentRepository';

/**
 * Health-document persistence PORT. Defined in the domain; implemented by an
 * infrastructure adapter (Prisma). Stores metadata only — the file bytes live
 * behind the `DocumentStorage` port.
 */
export interface HealthDocumentRepository {
  save(document: HealthDocument): Promise<void>;
  findById(id: string): Promise<HealthDocument | null>;
  findByPetId(petId: string): Promise<HealthDocument[]>;
  deleteById(id: string): Promise<void>;
}
