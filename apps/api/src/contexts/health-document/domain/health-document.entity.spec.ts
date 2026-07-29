import { HealthDocument } from './health-document.entity';
import { InvalidHealthDocumentError } from './health-document.errors';
import type { NewPageData } from './document-page.entity';

const page = (id: string): NewPageData => ({
  storageFileId: `file-${id}`,
  mimeType: 'image/jpeg',
  sizeBytes: 1_800_000,
});

const validProps = () => ({
  petId: 'pet-1',
  householdId: 'household-1',
  uploaderUserId: 'user-1',
  documentType: 'VACCINATION',
  title: 'Rabies booster',
  documentDate: new Date('2026-06-12'),
  tags: ['rabies', 'booster'],
  pages: [page('a'), page('b')],
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

  it('assigns contiguous positions 1..N from the input order', () => {
    const document = HealthDocument.create({
      ...validProps(),
      pages: [page('a'), page('b'), page('c')],
    });

    expect(document.pageCount).toBe(3);
    expect(document.pages.map((p) => p.position)).toEqual([1, 2, 3]);
    expect(document.pages.map((p) => p.storageFileId)).toEqual([
      'file-a',
      'file-b',
      'file-c',
    ]);
  });

  it('rejects an empty page list', () => {
    expect(() =>
      HealthDocument.create({ ...validProps(), pages: [] }),
    ).toThrow(InvalidHealthDocumentError);
  });

  it('appends pages continuing at N+1', () => {
    const document = HealthDocument.create({
      ...validProps(),
      pages: [page('a'), page('b')],
    });

    const appended = document.appendPages([page('c'), page('d')]);

    expect(document.pageCount).toBe(4);
    expect(document.pages.map((p) => p.position)).toEqual([1, 2, 3, 4]);
    expect(appended.map((p) => p.position)).toEqual([3, 4]);
    expect(appended.map((p) => p.storageFileId)).toEqual(['file-c', 'file-d']);
  });

  it('rejects appending an empty batch', () => {
    const document = HealthDocument.create(validProps());
    expect(() => document.appendPages([])).toThrow(InvalidHealthDocumentError);
  });

  it('rejects a snapshot with non-contiguous page positions', () => {
    const snapshot = HealthDocument.create(validProps()).toSnapshot();
    // Corrupt the ordering: two pages at position 1, a gap at 2.
    snapshot.pages[1] = { ...snapshot.pages[1], position: 3 };

    expect(() => HealthDocument.fromSnapshot(snapshot)).toThrow(
      InvalidHealthDocumentError,
    );
  });

  it('reorders pages by position when rebuilt from a snapshot', () => {
    const snapshot = HealthDocument.create({
      ...validProps(),
      pages: [page('a'), page('b'), page('c')],
    }).toSnapshot();
    // Persistence may return rows in any order.
    snapshot.pages.reverse();

    const rebuilt = HealthDocument.fromSnapshot(snapshot);
    expect(rebuilt.pages.map((p) => p.position)).toEqual([1, 2, 3]);
  });

  it('finds a page by id and returns undefined for a foreign one', () => {
    const document = HealthDocument.create(validProps());
    const first = document.pages[0];
    expect(document.findPage(first.id)?.id).toBe(first.id);
    expect(document.findPage('nope')).toBeUndefined();
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

  it('rejects a non-positive page size', () => {
    expect(() =>
      HealthDocument.create({
        ...validProps(),
        pages: [{ ...page('a'), sizeBytes: 0 }],
      }),
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
