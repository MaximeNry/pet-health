import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { HealthDocument } from '../domain/health-document.entity';
import { HealthDocumentRepository } from '../domain/health-document.repository';
import { HealthDocumentMapper } from './health-document.mapper';

/**
 * Prisma adapter for the `HealthDocumentRepository` port. `save` persists the
 * whole aggregate — the document metadata plus its pages — in a single
 * transaction. Pages are immutable once created and only ever appended, so
 * `createMany({ skipDuplicates })` upserts them by id: existing pages are
 * skipped, newly appended ones inserted. Timestamps stay DB-managed.
 */
@Injectable()
export class PrismaHealthDocumentRepository implements HealthDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(document: HealthDocument): Promise<void> {
    const { document: data, pages } =
      HealthDocumentMapper.toPersistence(document);

    await this.prisma.$transaction(async (tx) => {
      await tx.healthDocument.upsert({
        where: { id: data.id },
        create: data,
        update: {
          documentType: data.documentType,
          title: data.title,
          documentDate: data.documentDate,
          tags: data.tags,
        },
      });
      // Insert only pages not already persisted (create-all on first save,
      // just the appended ones on later saves).
      await tx.documentPage.createMany({ data: pages, skipDuplicates: true });
    });
  }

  async findById(id: string): Promise<HealthDocument | null> {
    const record = await this.prisma.healthDocument.findUnique({
      where: { id },
      include: { pages: true },
    });
    return record ? HealthDocumentMapper.toDomain(record) : null;
  }

  async findByPetId(petId: string): Promise<HealthDocument[]> {
    const records = await this.prisma.healthDocument.findMany({
      where: { petId },
      include: { pages: true },
      // Most recent document first — matches the timeline the UI shows.
      orderBy: { documentDate: 'desc' },
    });
    return records.map((record) => HealthDocumentMapper.toDomain(record));
  }

  async deleteById(id: string): Promise<void> {
    // Pages are removed by the `onDelete: Cascade` FK.
    await this.prisma.healthDocument.delete({ where: { id } });
  }
}
