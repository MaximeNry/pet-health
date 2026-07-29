import { extensionForMime } from './file-extension';

/** Document fields needed to build a readable, sortable file name. */
export interface FileNameContext {
  title: string;
  documentDate: Date;
}

/**
 * Builds a stored file name for one page, e.g.
 * "2026-06-12 Rabies booster.jpg" for a single page, or
 * "2026-06-12 Rabies booster (2 of 3).jpg" for a page of a multi-page batch —
 * sortable and human-readable in the user's Drive.
 */
export function buildPageFileName(
  context: FileNameContext,
  mimeType: string,
  position: number,
  totalPages: number,
): string {
  const date = context.documentDate.toISOString().slice(0, 10);
  const extension = extensionForMime(mimeType);
  // Strip characters that are risky in file names across storages.
  const safeTitle = context.title.trim().replace(/[\\/:*?"<>|]/g, ' ');
  const suffix = totalPages > 1 ? ` (${position} of ${totalPages})` : '';
  return `${date} ${safeTitle}${suffix}.${extension}`;
}
