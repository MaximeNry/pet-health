'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentQueryKey } from './usePetDocument';
import { petDocumentsQueryKey } from './usePetDocuments';

/**
 * Appends a staged batch of scans to an existing document, exposing the live
 * upload progress (0..1). On success it refreshes both the document detail and
 * the pet's list so the new pages appear.
 */
export function useAddPages(petId: string, documentId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (files: Blob[]) => {
      setProgress(0);
      return documentsAdapter.addPages(petId, documentId, files, setProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: petDocumentQueryKey(petId, documentId),
      });
      queryClient.invalidateQueries({ queryKey: petDocumentsQueryKey(petId) });
    },
  });

  return { ...mutation, progress };
}
