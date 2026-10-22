import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { HealthDocumentDirectory } from '../domain/health-document-directory.port';

/**
 * Prisma adapter for the `HealthDocumentDirectory` port: a read-only lookup
 * on the health documents table (shared database, one column read).
 */
@Injectable()
export class PrismaHealthDocumentDirectoryAdapter implements HealthDocumentDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async findPetIdOfDocument(documentId: string): Promise<string | null> {
    const document = await this.prisma.healthDocument.findUnique({
      where: { id: documentId },
      select: { petId: true },
    });
    return document?.petId ?? null;
  }
}
