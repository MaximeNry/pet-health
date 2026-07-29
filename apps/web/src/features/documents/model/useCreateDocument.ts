'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDocumentInput } from '../api/documentsAdapter';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentsQueryKey } from './usePetDocuments';

/**
 * Creates a multi-page document from a staged batch of scans and exposes the
 * live upload progress (0..1) next to the usual mutation state, then refreshes
 * the pet's document list.
 */
export function useCreateDocument(petId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (input: CreateDocumentInput) => {
      setProgress(0);
      return documentsAdapter.create(petId, input, setProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petDocumentsQueryKey(petId) });
    },
  });

  return { ...mutation, progress };
}
