'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsAdapter } from '../api/documentsAdapter';

/**
 * The file bytes of a document, exposed as a `Blob` plus an object URL ready
 * for `<img>` / `<iframe>` / download links. The blob goes through the
 * authenticated API client (a plain `src` URL could not send the session
 * cookie reliably); the object URL is revoked when the blob changes or the
 * consumer unmounts.
 */
export function useDocumentContent(petId: string, documentId: string) {
  const query = useQuery({
    queryKey: ['pet-document-content', petId, documentId] as const,
    queryFn: () => documentsAdapter.getContent(petId, documentId),
    // The bytes of a stored document never change (metadata edits aside).
    staleTime: Infinity,
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
