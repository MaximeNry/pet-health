import type { DocumentType } from './types';

/**
 * Per-type colors shared by the document card (badge + paper strip) and the
 * detail screen (category pill), from the design mockups "Variantes
 * Documents" and "Document Detail". Hues outside the brand palette (blue,
 * gold, violet, rose) have no @theme token, hence raw hex.
 */
export const DOCUMENT_TYPE_PALETTE: Record<
  DocumentType,
  { badgeBg: string; badgeFg: string; strip: string }
> = {
  VACCINATION: {
    badgeBg: 'var(--color-green-50)',
    badgeFg: 'var(--color-green-600)',
    strip: 'var(--color-green-400)',
  },
  PRESCRIPTION: {
    badgeBg: 'var(--color-coral-50)',
    badgeFg: 'var(--color-coral-700)',
    strip: 'var(--color-coral-400)',
  },
  LAB_RESULT: { badgeBg: '#EAF1F9', badgeFg: '#2E6BA8', strip: '#6AA0D8' },
  CERTIFICATE: {
    badgeBg: '#FBF1DE',
    badgeFg: '#946212',
    strip: 'var(--color-amber-500)',
  },
  IDENTIFICATION: { badgeBg: '#F0EBF9', badgeFg: '#5F45A8', strip: '#9C82D8' },
  SURGERY: { badgeBg: '#FBEDF3', badgeFg: '#AD3A68', strip: '#DD7BA8' },
  OTHER: {
    badgeBg: 'var(--color-stone-100)',
    badgeFg: 'var(--color-stone-600)',
    strip: 'var(--color-stone-400)',
  },
};

/** File extension by accepted mime type — mirrors the API's mapping. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/** Download file name for a document, e.g. "Carnet de vaccination.pdf". */
export function documentFileName(document: {
  title: string;
  mimeType: string;
}): string {
  const extension = EXTENSION_BY_MIME[document.mimeType] ?? 'bin';
  return `${document.title}.${extension}`;
}
