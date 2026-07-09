'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadDocumentInput } from '../api/documentsAdapter';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentsQueryKey } from './usePetDocuments';

/**
 * Uploads a scanned document and exposes the live upload progress (0..1)
 * next to the usual mutation state, then refreshes the pet's document list.
 */
export function useUploadDocument(petId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (input: UploadDocumentInput) => {
      setProgress(0);
      return documentsAdapter.upload(petId, input, setProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petDocumentsQueryKey(petId) });
    },
  });

  return { ...mutation, progress };
}
