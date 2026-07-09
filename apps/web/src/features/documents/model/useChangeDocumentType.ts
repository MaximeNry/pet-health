'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentType } from '@/entities/document';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentQueryKey } from './usePetDocument';
import { petDocumentsQueryKey } from './usePetDocuments';

/** Recategorizes a document, then refreshes the detail and the pet's list. */
export function useChangeDocumentType(petId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentType: DocumentType) =>
      documentsAdapter.changeType(petId, documentId, documentType),
    onSuccess: (updated) => {
      queryClient.setQueryData(petDocumentQueryKey(petId, documentId), updated);
      void queryClient.invalidateQueries({
        queryKey: petDocumentsQueryKey(petId),
      });
    },
  });
}
