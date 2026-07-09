import { Inject, Injectable } from '@nestjs/common';
import { HealthDocument } from '../domain/health-document.entity';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';

export interface ChangeDocumentTypeCommand {
  petId: string;
  documentId: string;
  documentType: string;
}

/** Recategorizes a document; the entity enforces the valid types. */
@Injectable()
export class ChangeDocumentTypeUseCase {
  constructor(
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: ChangeDocumentTypeCommand): Promise<HealthDocument> {
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );
    document.changeDocumentType(command.documentType);
    await this.documents.save(document);
    return document;
  }
}
