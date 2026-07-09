import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { HealthDocument } from '../domain/health-document.entity';
import { HealthDocumentRepository } from '../domain/health-document.repository';
import { HealthDocumentMapper } from './health-document.mapper';

/**
 * Prisma adapter for the `HealthDocumentRepository` port. `save` performs an
 * upsert; timestamps stay managed by the database.
 */
@Injectable()
export class PrismaHealthDocumentRepository implements HealthDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(document: HealthDocument): Promise<void> {
    const data = HealthDocumentMapper.toPersistence(document);
    await this.prisma.healthDocument.upsert({
      where: { id: data.id },
      create: data,
      update: {
        documentType: data.documentType,
        title: data.title,
        documentDate: data.documentDate,
        tags: data.tags,
      },
    });
  }

  async findById(id: string): Promise<HealthDocument | null> {
    const record = await this.prisma.healthDocument.findUnique({
      where: { id },
    });
    return record ? HealthDocumentMapper.toDomain(record) : null;
  }

  async findByPetId(petId: string): Promise<HealthDocument[]> {
    const records = await this.prisma.healthDocument.findMany({
      where: { petId },
      // Most recent document first — matches the timeline the UI shows.
      orderBy: { documentDate: 'desc' },
    });
    return records.map((record) => HealthDocumentMapper.toDomain(record));
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.healthDocument.delete({ where: { id } });
  }
}
