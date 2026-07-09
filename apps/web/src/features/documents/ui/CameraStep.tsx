'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CloseIcon,
  FlashIcon,
  SwitchCameraIcon,
} from '@/shared/ui/icons';
import type { ScanImage } from './ScanFlow';

type Facing = 'environment' | 'user';

/** Video track constraint for torch — not in the TS lib DOM typings yet. */
interface TorchCapableTrack extends MediaStreamTrack {
  getCapabilities(): MediaTrackCapabilities & { torch?: boolean };
  applyConstraints(
    constraints: MediaTrackConstraints & {
      advanced?: Array<{ torch?: boolean }>;
    },
  ): Promise<void>;
}

/**
 * Step 1 — live camera viewfinder (design frame "Camera"): A4 framing window
 * with corner brackets, capture shutter, camera switch and torch toggle
 * (each only when the device supports it). Capturing draws the current video
 * frame to a canvas at native resolution and emits a JPEG blob.
 */
export function CameraStep({
  petName,
  onCancel,
  onCaptured,
  onUnavailable,
}: {
  petName: string;
  onCancel: () => void;
  onCaptured: (image: ScanImage) => void;
  onUnavailable: (reason: 'denied' | 'unavailable') => void;
}) {
  const t = useTranslations('documents.scan.camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [ready, setReady] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setReady(false);
      setTorchSupported(false);
      setTorchOn(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          // High ideal resolution: the scan is only as good as the capture.
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 2560 },
            height: { ideal: 1440 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);

        const track = stream.getVideoTracks()[0] as TorchCapableTrack;
        setTorchSupported(
          typeof track.getCapabilities === 'function' &&
            track.getCapabilities().torch === true,
        );

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setHasMultipleCameras(
            devices.filter((device) => device.kind === 'videoinput').length >
              1,
          );
        }
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : '';
        onUnavailable(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'denied'
            : 'unavailable',
        );
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopStream();
    };
    // Restarting on facing change replaces the stream.
  }, [facing, onUnavailable, stopStream]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0] as
      | TorchCapableTrack
      | undefined;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      // The device refused (e.g. front camera): leave the toggle as is.
    }
  }, [torchOn]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCaptured({ blob, url: URL.createObjectURL(blob) });
        }
      },
      'image/jpeg',
      0.92,
    );
  }, [onCaptured]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-stone-900">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Framing window: dims everything outside via a huge box-shadow. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] aspect-[256/362] w-[64%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-[10px]"
        style={{ boxShadow: '0 0 0 2000px rgba(9, 14, 11, 0.58)' }}
      >
        <div className="absolute -left-0.5 -top-0.5 h-[30px] w-[30px] rounded-tl-[11px] border-l-[3px] border-t-[3px] border-white" />
        <div className="absolute -right-0.5 -top-0.5 h-[30px] w-[30px] rounded-tr-[11px] border-r-[3px] border-t-[3px] border-white" />
        <div className="absolute -bottom-0.5 -left-0.5 h-[30px] w-[30px] rounded-bl-[11px] border-b-[3px] border-l-[3px] border-white" />
        <div className="absolute -bottom-0.5 -right-0.5 h-[30px] w-[30px] rounded-br-[11px] border-b-[3px] border-r-[3px] border-white" />
      </div>

      {/* Top bar: cancel + context. */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-[18px] pt-[max(theme(spacing.10),env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label={t('cancel')}
          onClick={onCancel}
          className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-[0.5px] border-white/15 bg-[rgba(20,28,22,0.5)] text-white backdrop-blur-md transition hover:bg-[rgba(20,28,22,0.7)]"
        >
          <CloseIcon className="h-[19px] w-[19px]" />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold text-white">
            {t('title', { name: petName })}
          </div>
          <div className="mt-px text-xs font-medium text-white/60">
            {t('subtitle')}
          </div>
        </div>
        <div className="w-[42px]" />
      </div>

      {/* Helper chip. */}
      <div className="absolute bottom-[178px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[7px] whitespace-nowrap rounded-pill bg-[rgba(9,14,11,0.55)] px-3.5 py-2 backdrop-blur-md">
        <span
          className={`h-[7px] w-[7px] rounded-full ${
            ready
              ? 'bg-green-400 shadow-[0_0_0_4px_rgba(63,168,123,0.25)]'
              : 'bg-white/40'
          }`}
        />
        <span className="text-[13px] font-semibold text-white/90">
          {ready ? t('readyHint') : t('startingHint')}
        </span>
      </div>

      {/* Bottom controls. */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-t from-[rgba(7,11,9,0.92)] from-30% to-transparent px-[30px] pb-[max(theme(spacing.12),env(safe-area-inset-bottom))] pt-[26px]">
        <div className="flex w-[64px] flex-col items-center gap-[7px]">
          {hasMultipleCameras && (
            <>
              <button
                type="button"
                aria-label={t('switchCamera')}
                onClick={() =>
                  setFacing(facing === 'environment' ? 'user' : 'environment')
                }
                className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-[0.5px] border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              >
                <SwitchCameraIcon className="h-[23px] w-[23px]" />
              </button>
              <span className="text-[11px] font-medium text-white/60">
                {t('switchCameraLabel')}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={t('capture')}
          onClick={capture}
          disabled={!ready}
          className="flex h-[78px] w-[78px] cursor-pointer items-center justify-center rounded-full border-[5px] border-white shadow-[0_6px_22px_rgba(0,0,0,0.5)] transition active:scale-95 disabled:opacity-50"
        >
          <span className="h-[60px] w-[60px] rounded-full bg-white" />
        </button>

        <div className="flex w-[64px] flex-col items-center gap-[7px]">
          {torchSupported && (
            <>
              <button
                type="button"
                aria-label={t('flash')}
                aria-pressed={torchOn}
                onClick={() => void toggleTorch()}
                className={`flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-[0.5px] transition ${
                  torchOn
                    ? 'border-[rgba(236,122,86,0.4)] bg-[rgba(236,122,86,0.22)] text-coral-300'
                    : 'border-white/15 bg-white/10 text-white'
                }`}
              >
                <FlashIcon className="h-[21px] w-[21px]" />
              </button>
              <span
                className={`text-[11px] font-semibold ${torchOn ? 'text-coral-300' : 'text-white/60'}`}
              >
                {torchOn ? t('flashOn') : t('flashOff')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
