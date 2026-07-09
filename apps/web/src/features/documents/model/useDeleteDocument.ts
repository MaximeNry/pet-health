'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentQueryKey } from './usePetDocument';
import { petDocumentsQueryKey } from './usePetDocuments';

/** Deletes a document (file + metadata) and drops it from the caches. */
export function useDeleteDocument(petId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => documentsAdapter.remove(petId, documentId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: petDocumentQueryKey(petId, documentId),
      });
      queryClient.removeQueries({
        queryKey: ['pet-document-content', petId, documentId],
      });
      void queryClient.invalidateQueries({
        queryKey: petDocumentsQueryKey(petId),
      });
    },
  });
}
