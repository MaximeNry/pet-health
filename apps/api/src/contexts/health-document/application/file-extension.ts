/** File extension by accepted mime type, for readable file names. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export function extensionForMime(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? 'bin';
}
