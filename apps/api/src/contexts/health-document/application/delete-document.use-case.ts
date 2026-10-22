import { Inject, Injectable } from '@nestjs/common';
import { HEALTH_DOCUMENT_REPOSITORY } from '../domain/health-document.repository';
import type { HealthDocumentRepository } from '../domain/health-document.repository';
import { GetPetDocumentUseCase } from './get-pet-document.use-case';

export interface DeleteDocumentCommand {
  petId: string;
  documentId: string;
}

/**
 * Removes a document and all its pages from the app (the DB cascade drops the
 * page rows with the document). The stored files are deliberately kept: they
 * live in the uploader's own Drive, and only that owner may delete them, by
 * hand — no household member can destroy another member's files through the
 * app.
 */
@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    private readonly getDocument: GetPetDocumentUseCase,
  ) {}

  async execute(command: DeleteDocumentCommand): Promise<void> {
    const document = await this.getDocument.execute(
      command.petId,
      command.documentId,
    );
    await this.documents.deleteById(document.id);
  }
}
