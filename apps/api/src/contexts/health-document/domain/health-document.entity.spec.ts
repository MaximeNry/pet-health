import { HealthDocument } from './health-document.entity';
import { InvalidHealthDocumentError } from './health-document.errors';

const validProps = () => ({
  petId: 'pet-1',
  householdId: 'household-1',
  storageFileId: 'file-1',
  documentType: 'VACCINATION',
  title: 'Rabies booster',
  documentDate: new Date('2026-06-12'),
  tags: ['rabies', 'booster'],
  mimeType: 'image/jpeg',
  sizeBytes: 1_800_000,
});

describe('HealthDocument', () => {
  it('creates a document with generated identity and normalized fields', () => {
    const document = HealthDocument.create({
      ...validProps(),
      title: '  Rabies booster  ',
      tags: [' rabies', 'Rabies', '', 'booster '],
    });

    expect(document.id).toBeDefined();
    expect(document.title).toBe('Rabies booster');
    // Tags are trimmed, deduplicated case-insensitively, empties dropped.
    expect(document.tags).toEqual(['rabies', 'booster']);
    expect(document.documentType).toBe('VACCINATION');
  });

  it('rejects an unknown document type', () => {
    expect(() =>
      HealthDocument.create({ ...validProps(), documentType: 'SELFIE' }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('rejects an empty title', () => {
    expect(() =>
      HealthDocument.create({ ...validProps(), title: '   ' }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('rejects a document date in the future', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(() =>
      HealthDocument.create({ ...validProps(), documentDate: future }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('rejects a non-positive file size', () => {
    expect(() =>
      HealthDocument.create({ ...validProps(), sizeBytes: 0 }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('rejects more than 20 tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
    expect(() => HealthDocument.create({ ...validProps(), tags })).toThrow(
      InvalidHealthDocumentError,
    );
  });

  it('validates metadata without creating the entity', () => {
    expect(() =>
      HealthDocument.validateMetadata({
        documentType: 'OTHER',
        title: 'Insurance form',
        documentDate: new Date('2025-01-01'),
      }),
    ).not.toThrow();

    expect(() =>
      HealthDocument.validateMetadata({
        documentType: 'OTHER',
        title: '',
        documentDate: new Date('2025-01-01'),
      }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('round-trips through a snapshot', () => {
    const document = HealthDocument.create(validProps());
    const rebuilt = HealthDocument.fromSnapshot(document.toSnapshot());

    expect(rebuilt.equals(document)).toBe(true);
    expect(rebuilt.toSnapshot()).toEqual(document.toSnapshot());
  });
});
