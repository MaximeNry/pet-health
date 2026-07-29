'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Pet } from '@/entities/pet';
import { useAddPages } from '../model/useAddPages';
import { CaptureStaging } from './CaptureStaging';
import type { ScanImage } from './ScanFlow';
import { UploadOverlay } from './UploadOverlay';

/**
 * Append-pages flow: reuses the batch capture UI (camera → crop → staging
 * review) to add pages to an existing document, then uploads them to the
 * append endpoint. No metadata step — the document already carries it.
 */
export function AppendPagesFlow({
  pet,
  documentId,
}: {
  pet: Pet;
  documentId: string;
}) {
  const t = useTranslations('documents.scan.review');
  const router = useRouter();
  const add = useAddPages(pet.id, documentId);

  const urlsRef = useRef<string[]>([]);
  const pagesRef = useRef<ScanImage[]>([]);
  const trackUrl = useCallback((image: ScanImage) => {
    urlsRef.current.push(image.url);
  }, []);
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const backToDocument = useCallback(() => {
    router.push(`/pets/${pet.id}/documents/${documentId}`);
  }, [router, pet.id, documentId]);

  const submit = useCallback(
    (batch: ScanImage[]) => {
      if (batch.length === 0) return;
      pagesRef.current = batch;
      add.mutate(batch.map((page) => page.blob));
    },
    [add],
  );

  return (
    <div className="fixed inset-0 z-40 bg-stone-900">
      <CaptureStaging
        petName={pet.name}
        initialPages={[]}
        continueLabel={t('addToDocument')}
        onComplete={submit}
        onCancel={backToDocument}
        onTrackUrl={trackUrl}
      />

      {(add.isPending || add.isSuccess || add.isError) && (
        <UploadOverlay
          progress={add.progress}
          status={
            add.isSuccess ? 'success' : add.isError ? 'error' : 'uploading'
          }
          onDone={backToDocument}
          onRetry={() => submit(pagesRef.current)}
          onDismiss={() => add.reset()}
        />
      )}
    </div>
  );
}
