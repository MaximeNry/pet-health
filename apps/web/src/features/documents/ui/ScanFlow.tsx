'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pet } from '@/entities/pet';
import type { DocumentType } from '@/entities/document';
import { useUploadDocument } from '../model/useUploadDocument';
import { CameraDeniedScreen } from './CameraDeniedScreen';
import { CameraStep } from './CameraStep';
import { CropStep } from './CropStep';
import { MetadataStep } from './MetadataStep';
import { UploadOverlay } from './UploadOverlay';

type Step = 'camera' | 'denied' | 'crop' | 'metadata';

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
 * Document scan flow (design: "Capture de document mobile"): camera capture →
 * crop/rotate/contrast → metadata form → upload to storage, plus the
 * camera-permission error screen. Fullscreen, mobile-first.
 */
export function ScanFlow({ pet }: { pet: Pet }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('camera');
  const [deniedReason, setDeniedReason] = useState<'denied' | 'unavailable'>(
    'denied',
  );
  const [capture, setCapture] = useState<ScanImage | null>(null);
  const [processed, setProcessed] = useState<ScanImage | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: 'VACCINATION',
    title: '',
    documentDate: todayIso(),
    tags: [],
  });

  const upload = useUploadDocument(pet.id);

  // Object URLs leak unless revoked; track the latest ones for unmount.
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

  const handleCaptured = useCallback(
    (image: ScanImage) => {
      trackUrl(image);
      setCapture(image);
      setStep('crop');
    },
    [trackUrl],
  );

  const handleCropDone = useCallback(
    (image: ScanImage) => {
      trackUrl(image);
      setProcessed(image);
      setStep('metadata');
    },
    [trackUrl],
  );

  const handleSubmit = useCallback(() => {
    if (!processed) return;
    upload.mutate({
      householdId: pet.householdId,
      documentType: metadata.documentType,
      title: metadata.title,
      documentDate: metadata.documentDate,
      tags: metadata.tags,
      file: processed.blob,
    });
  }, [processed, upload, pet.householdId, metadata]);

  return (
    <div className="fixed inset-0 z-40 bg-stone-900">
      {step === 'camera' && (
        <CameraStep
          petName={pet.name}
          onCancel={backToPet}
          onCaptured={handleCaptured}
          onUnavailable={(reason) => {
            setDeniedReason(reason);
            setStep('denied');
          }}
        />
      )}

      {step === 'denied' && (
        <CameraDeniedScreen
          petName={pet.name}
          reason={deniedReason}
          onRetry={() => setStep('camera')}
          onCancel={backToPet}
        />
      )}

      {step === 'crop' && capture && (
        <CropStep
          image={capture}
          onRetake={() => setStep('camera')}
          onDone={handleCropDone}
        />
      )}

      {step === 'metadata' && processed && (
        <MetadataStep
          petName={pet.name}
          preview={processed}
          metadata={metadata}
          onChange={setMetadata}
          onEditImage={() => setStep('crop')}
          onCancel={backToPet}
          onSubmit={handleSubmit}
          submitting={upload.isPending}
        />
      )}

      {(upload.isPending || upload.isSuccess || upload.isError) && (
        <UploadOverlay
          progress={upload.progress}
          status={
            upload.isSuccess
              ? 'success'
              : upload.isError
                ? 'error'
                : 'uploading'
          }
          onDone={backToPet}
          onRetry={handleSubmit}
          onDismiss={() => upload.reset()}
        />
      )}
    </div>
  );
}
