'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsAdapter } from '../api/documentsAdapter';

/**
 * The file bytes of a single document page, exposed as a `Blob` plus an object
 * URL ready for `<img>` / `<iframe>` / download links. The blob goes through
 * the authenticated API client (a plain `src` URL could not send the session
 * cookie reliably); the object URL is revoked when the blob changes or the
 * consumer unmounts. Pass `enabled: false` to defer the fetch.
 */
export function usePageContent(
  petId: string,
  documentId: string,
  pageId: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['pet-document-page-content', petId, documentId, pageId] as const,
    queryFn: () => documentsAdapter.getPageContent(petId, documentId, pageId),
    // The bytes of a stored page never change.
    staleTime: Infinity,
    enabled,
  });

  const blob = query.data;
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return {
    blob: blob ?? null,
    /** null while loading (or on error). */
    url,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
