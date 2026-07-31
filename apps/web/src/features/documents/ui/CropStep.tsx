'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, RotateIcon } from '@/shared/ui/icons';
import type { ScanImage } from './ScanFlow';

/** Crop rectangle, normalized (0..1) relative to the displayed image. */
interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move';

const MIN_SIZE = 0.15;
/** Default crop: a slight inset, standing in for real edge detection. */
const DEFAULT_RECT: CropRect = { x: 0.04, y: 0.04, w: 0.92, h: 0.92 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('canvas.toBlob failed')),
      'image/jpeg',
      0.92,
    );
  });
}

/**
 * Step 2 — preview & crop (design frame "Preview & crop"): draggable
 * crop frame with corner/edge handles over the captured photo, 90° rotation,
 * contrast adjustment, rule-of-thirds grid. Confirming bakes rotation, crop
 * and contrast into a new JPEG via canvas.
 */
export function CropStep({
  image,
  onRetake,
  onDone,
}: {
  image: ScanImage;
  onRetake: () => void;
  onDone: (image: ScanImage) => void;
}) {
  const t = useTranslations('documents.scan.crop');
  // Working image = capture with rotations baked in (crop math stays axis-aligned).
  const [working, setWorking] = useState<ScanImage>(image);
  const [rect, setRect] = useState<CropRect>(DEFAULT_RECT);
  const [contrast, setContrast] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  // Reset when a new photo arrives (retake) — state adjusted during render,
  // as recommended over a setState-in-effect.
  const [prevImage, setPrevImage] = useState(image);
  if (prevImage !== image) {
    setPrevImage(image);
    setWorking(image);
    setRect(DEFAULT_RECT);
    setContrast(100);
  }

  const ownedUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void loadImage(working.url).then((img) => {
      if (!cancelled) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [working.url]);

  const startDrag = useCallback(
    (handle: Handle) => (event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = {
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startRect: rect,
      };
    },
    [rect],
  );

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = dragRef.current;
      const frame = frameRef.current;
      if (!drag || !frame) return;
      const bounds = frame.getBoundingClientRect();
      const dx = (event.clientX - drag.startX) / bounds.width;
      const dy = (event.clientY - drag.startY) / bounds.height;
      const start = drag.startRect;
      let { x, y, w, h } = start;

      if (drag.handle === 'move') {
        x = clamp(start.x + dx, 0, 1 - start.w);
        y = clamp(start.y + dy, 0, 1 - start.h);
      } else {
        // Left/top edges move the origin; right/bottom edges resize only.
        if (drag.handle.includes('w')) {
          const newX = clamp(start.x + dx, 0, start.x + start.w - MIN_SIZE);
          w = start.w + (start.x - newX);
          x = newX;
        }
        if (drag.handle.includes('e')) {
          w = clamp(start.w + dx, MIN_SIZE, 1 - start.x);
        }
        if (drag.handle.includes('n')) {
          const newY = clamp(start.y + dy, 0, start.y + start.h - MIN_SIZE);
          h = start.h + (start.y - newY);
          y = newY;
        }
        if (drag.handle.includes('s')) {
          h = clamp(start.h + dy, MIN_SIZE, 1 - start.y);
        }
      }
      setRect({ x, y, w, h });
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const rotate = useCallback(async () => {
    const img = await loadImage(working.url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 90° clockwise.
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
    const blob = await canvasToJpeg(canvas);
    const url = URL.createObjectURL(blob);
    ownedUrls.current.push(url);
    setWorking({ blob, url });
    setRect(DEFAULT_RECT);
  }, [working.url]);

  const validate = useCallback(async () => {
    setProcessing(true);
    try {
      const img = await loadImage(working.url);
      const sx = Math.round(rect.x * img.naturalWidth);
      const sy = Math.round(rect.y * img.naturalHeight);
      const sw = Math.max(1, Math.round(rect.w * img.naturalWidth));
      const sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Canvas filters are unsupported in older Safari: the crop still
      // applies, only the contrast bake is skipped there.
      if ('filter' in ctx) {
        ctx.filter = `contrast(${contrast}%)`;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await canvasToJpeg(canvas);
      onDone({ blob, url: URL.createObjectURL(blob) });
    } finally {
      setProcessing(false);
    }
  }, [working.url, rect, contrast, onDone]);

  const pct = (value: number) => `${value * 100}%`;

  return (
    <div className="flex h-full w-full flex-col bg-[#0d1411]">
      {/* Top bar. */}
      <div className="flex items-center justify-between px-5 pb-3 pt-[max(theme(spacing.12),env(safe-area-inset-top))]">
        <h1 className="text-[19px] font-bold tracking-[-0.01em] text-white">
          {t('title')}
        </h1>
        <div className="flex items-center gap-[7px] rounded-pill border-[0.5px] border-[rgba(63,168,123,0.4)] bg-[rgba(31,138,91,0.2)] px-[13px] py-[7px]">
          <span className="whitespace-nowrap text-xs font-semibold text-green-200">
            {t('autoDetected')}
          </span>
        </div>
      </div>

      {/* Captured photo + crop overlay. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 pt-1.5">
        <div
          ref={frameRef}
          className="relative max-h-full max-w-full touch-none select-none"
          style={{
            aspectRatio: aspectRatio ?? 3 / 4,
            // Fit inside the flex area whatever the photo orientation.
            width:
              aspectRatio !== null && aspectRatio > 1 ? '100%' : undefined,
            height:
              aspectRatio === null || aspectRatio <= 1 ? '100%' : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it */}
          <img
            src={working.url}
            alt={t('previewAlt')}
            className="h-full w-full rounded-[3px] object-contain"
            style={{ filter: `contrast(${contrast}%)` }}
            draggable={false}
          />

          {/* Rule-of-thirds grid inside the crop rect. */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: pct(rect.x),
              top: pct(rect.y),
              width: pct(rect.w),
              height: pct(rect.h),
            }}
          >
            <div className="absolute bottom-0 left-1/3 top-0 w-px bg-white/35" />
            <div className="absolute bottom-0 left-2/3 top-0 w-px bg-white/35" />
            <div className="absolute left-0 right-0 top-1/3 h-px bg-white/35" />
            <div className="absolute left-0 right-0 top-2/3 h-px bg-white/35" />
          </div>

          {/* Crop frame: dims the outside via a huge box-shadow. */}
          <div
            className="absolute cursor-move rounded-[3px] border-2 border-white"
            style={{
              left: pct(rect.x),
              top: pct(rect.y),
              width: pct(rect.w),
              height: pct(rect.h),
              boxShadow: '0 0 0 3000px rgba(13, 20, 17, 0.55)',
            }}
            onPointerDown={startDrag('move')}
          >
            {(
              [
                ['nw', '-left-[7px] -top-[7px] cursor-nwse-resize'],
                ['ne', '-right-[7px] -top-[7px] cursor-nesw-resize'],
                ['sw', '-bottom-[7px] -left-[7px] cursor-nesw-resize'],
                ['se', '-bottom-[7px] -right-[7px] cursor-nwse-resize'],
              ] as const
            ).map(([handle, position]) => (
              <span
                key={handle}
                onPointerDown={startDrag(handle)}
                className={`absolute h-4 w-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] ${position}`}
              />
            ))}
            {(
              [
                [
                  'n',
                  '-top-1 left-1/2 h-2 w-[30px] -translate-x-1/2 cursor-ns-resize',
                ],
                [
                  's',
                  '-bottom-1 left-1/2 h-2 w-[30px] -translate-x-1/2 cursor-ns-resize',
                ],
                [
                  'w',
                  '-left-1 top-1/2 h-[30px] w-2 -translate-y-1/2 cursor-ew-resize',
                ],
                [
                  'e',
                  '-right-1 top-1/2 h-[30px] w-2 -translate-y-1/2 cursor-ew-resize',
                ],
              ] as const
            ).map(([handle, position]) => (
              <span
                key={handle}
                onPointerDown={startDrag(handle)}
                className={`absolute rounded-pill bg-white ${position}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Adjustment controls. */}
      <div className="flex justify-center gap-2.5 px-5 pb-1 pt-[18px]">
        <button
          type="button"
          onClick={() => void rotate()}
          className="flex cursor-pointer items-center gap-2 rounded-pill border-[0.5px] border-white/15 bg-white/10 px-4 py-[11px] text-white transition hover:bg-white/20"
        >
          <RotateIcon className="h-[18px] w-[18px]" />
          <span className="text-[13.5px] font-semibold">{t('rotate')}</span>
        </button>
      </div>

      {/* Contrast slider. */}
      <div className="flex items-center gap-3 px-[30px] pb-1.5 pt-3.5">
        <label
          htmlFor="scan-contrast"
          className="text-[11px] font-semibold text-white/50"
        >
          {t('contrast')}
        </label>
        <input
          id="scan-contrast"
          type="range"
          min={50}
          max={150}
          value={contrast}
          onChange={(event) => setContrast(Number(event.target.value))}
          className="h-1 flex-1 cursor-pointer accent-green-400"
        />
      </div>

      {/* Actions. */}
      <div className="flex gap-3 px-5 pb-[max(theme(spacing.8),env(safe-area-inset-bottom))] pt-3.5">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 cursor-pointer rounded-md border-[0.5px] border-white/20 bg-white/10 p-[15px] text-center text-base font-semibold text-white transition hover:bg-white/20"
        >
          {t('retake')}
        </button>
        <button
          type="button"
          onClick={() => void validate()}
          disabled={processing}
          className="ph-btn ph-btn-primary flex flex-[1.5] items-center justify-center gap-2 rounded-md bg-brand p-[15px] text-base font-semibold text-white shadow-brand disabled:opacity-60"
        >
          <CheckIcon className="h-[19px] w-[19px]" />
          {t('validate')}
        </button>
      </div>
    </div>
  );
}
