'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Pet } from '@/entities/pet';
import type { DocumentType } from '@/entities/document';
import { useCreateDocument } from '../model/useCreateDocument';
import { CaptureStaging } from './CaptureStaging';
import { MetadataStep } from './MetadataStep';
import { UploadOverlay } from './UploadOverlay';

/** A captured or processed image kept as blob + displayable object URL. */
export interface ScanImage {
  blob: Blob;
  url: string;
}

export interface DocumentMetadata {
  documentType: DocumentType;
  title: string;
  /** ISO date (yyyy-mm-dd). */
  documentDate: string;
  tags: string[];
}

/** Local date as yyyy-mm-dd (toISOString would shift across midnight UTC). */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Document scan flow (design: "Capture de document mobile"): capture a *batch*
 * of pages (camera → crop → staging review) → metadata form → single upload of
 * the whole multi-page document. Fullscreen, mobile-first. Batch staging is
 * ephemeral client state (held here, never in TanStack Query); closing the app
 * mid-staging loses the in-progress batch by design.
 */
export function ScanFlow({ pet }: { pet: Pet }) {
  const t = useTranslations('documents.scan.review');
  const router = useRouter();
  const [phase, setPhase] = useState<'capture' | 'metadata'>('capture');
  const [pages, setPages] = useState<ScanImage[]>([]);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: 'VACCINATION',
    title: '',
    documentDate: todayIso(),
    tags: [],
  });

  const create = useCreateDocument(pet.id);

  // Object URLs leak unless revoked; track every one created in this flow and
  // revoke them all when the flow unmounts.
  const urlsRef = useRef<string[]>([]);
  const trackUrl = useCallback((image: ScanImage) => {
    urlsRef.current.push(image.url);
  }, []);
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const backToPet = useCallback(() => {
    router.push(`/pets/${pet.id}`);
  }, [router, pet.id]);

  const handleBatchReady = useCallback((batch: ScanImage[]) => {
    setPages(batch);
    setPhase('metadata');
  }, []);

  const handleSubmit = useCallback(() => {
    if (pages.length === 0) return;
    create.mutate({
      householdId: pet.householdId,
      documentType: metadata.documentType,
      title: metadata.title,
      documentDate: metadata.documentDate,
      tags: metadata.tags,
      files: pages.map((page) => page.blob),
    });
  }, [pages, create, pet.householdId, metadata]);

  return (
    <div className="fixed inset-0 z-40 bg-stone-900">
      {phase === 'capture' && (
        <CaptureStaging
          petName={pet.name}
          initialPages={pages}
          continueLabel={t('continueToDetails')}
          onComplete={handleBatchReady}
          onCancel={backToPet}
          onTrackUrl={trackUrl}
        />
      )}

      {phase === 'metadata' && pages.length > 0 && (
        <MetadataStep
          petName={pet.name}
          preview={pages[0]}
          pageCount={pages.length}
          metadata={metadata}
          onChange={setMetadata}
          onEditImage={() => setPhase('capture')}
          onCancel={backToPet}
          onSubmit={handleSubmit}
          submitting={create.isPending}
        />
      )}

      {(create.isPending || create.isSuccess || create.isError) && (
        <UploadOverlay
          progress={create.progress}
          status={
            create.isSuccess
              ? 'success'
              : create.isError
                ? 'error'
                : 'uploading'
          }
          onDone={backToPet}
          onRetry={handleSubmit}
          onDismiss={() => create.reset()}
        />
      )}
    </div>
  );
}
