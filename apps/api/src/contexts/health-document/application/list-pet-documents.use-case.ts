import { Inject, Injectable } from '@nestjs/common';
import { HealthDocument } from '../domain/health-document.entity';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';

/** Lists the health documents attached to a pet. */
@Injectable()
export class ListPetDocumentsUseCase {
  constructor(
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
  ) {}

  execute(petId: string): Promise<HealthDocument[]> {
    return this.documents.findByPetId(petId);
  }
}
