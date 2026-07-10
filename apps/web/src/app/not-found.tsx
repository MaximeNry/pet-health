import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { PawMark } from '@/shared/ui/icons';

/** Rendered for unmatched routes (App Router `not-found` convention). */
export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-10 text-center">
        <PawMark className="mb-[18px] size-[34px] text-green-200" />
        <p className="font-display text-[84px] leading-[0.9] tracking-tight text-stone-300">
          404
        </p>
        <h1 className="mt-[18px] text-[26px] font-bold tracking-tight text-fg-1">
          {t('title')}
        </h1>
        <p className="mt-2.5 max-w-[280px] text-base leading-normal text-pretty text-fg-2">
          {t('description')}
        </p>
      </div>
      <div className="mx-auto w-full max-w-sm px-6 pb-[18px]">
        <Link
          href="/"
          className="ph-btn ph-btn-primary block rounded-md bg-brand px-5 py-4 text-center text-[16.5px] font-semibold text-white shadow-brand"
        >
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}
