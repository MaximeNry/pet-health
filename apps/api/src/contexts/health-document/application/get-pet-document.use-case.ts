import { Inject, Injectable } from '@nestjs/common';
import { HealthDocument } from '../domain/health-document.entity';
import { HealthDocumentNotFoundError } from '../domain/health-document.errors';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

/**
 * Fetches one document of a pet. The pet id from the route is part of the
 * lookup: a document reached through the wrong pet is a not-found, so ids
 * cannot be enumerated across pets.
 */
@Injectable()
export class GetPetDocumentUseCase {
  constructor(
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
  ) {}

  async execute(petId: string, documentId: string): Promise<HealthDocument> {
    const document = await this.documents.findById(documentId);
    if (!document || document.petId !== petId) {
      throw new HealthDocumentNotFoundError(documentId);
    }
    return document;
  }
}
