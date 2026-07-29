'use client';

import { useCallback, useState } from 'react';
import { CameraDeniedScreen } from './CameraDeniedScreen';
import { CameraStep } from './CameraStep';
import { CropStep } from './CropStep';
import type { ScanImage } from './ScanFlow';
import { StagingReview } from './StagingReview';

type Step = 'camera' | 'denied' | 'crop' | 'review';

/**
 * Reusable capture-into-batch flow shared by document creation and page
 * appending: camera capture → crop → a staging list the user can extend,
 * reorder and prune (all client-only). Calls `onComplete` with the ordered
 * pages when the user is done. The parent owns object-URL lifetimes via
 * `onTrackUrl` (URLs are revoked when the whole flow unmounts).
 */
export function CaptureStaging({
  petName,
  initialPages,
  continueLabel,
  onComplete,
  onCancel,
  onTrackUrl,
}: {
  petName: string;
  /** Pages already staged (e.g. when stepping back from the metadata form). */
  initialPages: ScanImage[];
  continueLabel: string;
  onComplete: (pages: ScanImage[]) => void;
  onCancel: () => void;
  onTrackUrl: (image: ScanImage) => void;
}) {
  const [pages, setPages] = useState<ScanImage[]>(initialPages);
  const [capture, setCapture] = useState<ScanImage | null>(null);
  // Resume on the review screen when pages already exist, else open the camera.
  const [step, setStep] = useState<Step>(
    initialPages.length > 0 ? 'review' : 'camera',
  );
  const [deniedReason, setDeniedReason] = useState<'denied' | 'unavailable'>(
    'denied',
  );

  const handleCaptured = useCallback(
    (image: ScanImage) => {
      onTrackUrl(image);
      setCapture(image);
      setStep('crop');
    },
    [onTrackUrl],
  );

  const handleCropDone = useCallback(
    (image: ScanImage) => {
      onTrackUrl(image);
      setPages((current) => [...current, image]);
      setStep('review');
    },
    [onTrackUrl],
  );

  const removeAt = useCallback((index: number) => {
    setPages((current) => current.filter((_, i) => i !== index));
  }, []);

  const moveBy = useCallback((index: number, delta: number) => {
    setPages((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  return (
    <>
      {step === 'camera' && (
        <CameraStep
          petName={petName}
          onCancel={pages.length > 0 ? () => setStep('review') : onCancel}
          onCaptured={handleCaptured}
          onUnavailable={(reason) => {
            setDeniedReason(reason);
            setStep('denied');
          }}
        />
      )}

      {step === 'denied' && (
        <CameraDeniedScreen
          petName={petName}
          reason={deniedReason}
          onRetry={() => setStep('camera')}
          onCancel={pages.length > 0 ? () => setStep('review') : onCancel}
        />
      )}

      {step === 'crop' && capture && (
        <CropStep
          image={capture}
          onRetake={() => setStep('camera')}
          onDone={handleCropDone}
        />
      )}

      {step === 'review' && (
        <StagingReview
          petName={petName}
          pages={pages}
          continueLabel={continueLabel}
          onAddPage={() => setStep('camera')}
          onRemove={removeAt}
          onMove={moveBy}
          onContinue={() => onComplete(pages)}
          onCancel={onCancel}
        />
      )}
    </>
  );
}
