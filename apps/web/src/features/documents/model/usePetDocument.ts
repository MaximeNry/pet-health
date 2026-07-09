'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthDocument } from '@/entities/document';
import { documentsAdapter } from '../api/documentsAdapter';
import { petDocumentsQueryKey } from './usePetDocuments';

export const petDocumentQueryKey = (petId: string, documentId: string) =>
  ['pet-document', petId, documentId] as const;

/**
 * One document of a pet. Seeds from the already-fetched list when the user
 * navigates from the documents grid, so the detail renders instantly.
 */
export function usePetDocument(petId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: petDocumentQueryKey(petId, documentId),
    queryFn: () => documentsAdapter.getById(petId, documentId),
    initialData: () =>
      queryClient
        .getQueryData<HealthDocument[]>(petDocumentsQueryKey(petId))
        ?.find((document) => document.id === documentId),
  });
}
