'use client';

import { useQuery } from '@tanstack/react-query';
import { documentsAdapter } from '../api/documentsAdapter';

export const petDocumentsQueryKey = (petId: string) =>
  ['pet-documents', petId] as const;

/** The health documents of a pet, most recent first (API ordering). */
export function usePetDocuments(petId: string) {
  return useQuery({
    queryKey: petDocumentsQueryKey(petId),
    queryFn: () => documentsAdapter.listByPet(petId),
  });
}
