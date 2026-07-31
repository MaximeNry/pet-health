'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Pet } from '@/entities/pet';
import { petAge } from '@/entities/pet';
import { DocumentList } from '@/features/documents';
import {
  BellIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  FileIcon,
  KebabIcon,
  MarsIcon,
  PencilIcon,
  PetIcon,
  ScanIcon,
  TagIcon,
  TrashIcon,
  VenusIcon,
  WeightIcon,
} from '@/shared/ui/icons';
import { usePet } from '../model/usePet';
import { DeletePetDialog } from './DeletePetDialog';
import { PetFormModal } from './PetFormModal';

type Tab = 'documents' | 'history' | 'reminders';
const TABS: Tab[] = ['documents', 'history', 'reminders'];

/**
 * Pet detail screen (design: "Pet detail with tabs", variant A):
 * centered profile header with attribute chips, then Documents / History /
 * Reminders tabs. Documents shows its empty state until the health-document
 * context lands; the other two tabs are "coming soon" placeholders.
 */
export function PetDetail({ petId }: { petId: string }) {
  const t = useTranslations('pets');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const petQuery = usePet(petId);
  const [tab, setTab] = useState<Tab>('documents');
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);

  if (petQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-fg-3">{tCommon('loading')}</p>
      </div>
    );
  }

  const pet = petQuery.data;
  if (!pet) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-base font-semibold text-fg-1">
          {t('detail.loadError')}
        </p>
        <Link
          href="/"
          className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg-1"
        >
          {t('detail.backToDashboard')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 pb-16">
        {/* Top bar: back to dashboard + actions menu */}
        <div className="flex items-center justify-between pb-2.5 pt-6">
          <Link
            href="/"
            aria-label={t('detail.back')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <PetActionsMenu
            onEdit={() => setDialog('edit')}
            onDelete={() => setDialog('delete')}
          />
        </div>

        <PetHeader pet={pet} />

        {/* Tabs */}
        <div className="mt-[18px] flex border-b border-border">
          {TABS.map((key) => {
            const active = key === tab;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-selected={active}
                role="tab"
                className={`-mb-px flex-1 cursor-pointer border-b-[2.5px] py-[11px] text-center text-[15px] transition ${
                  active
                    ? 'border-brand font-bold text-brand'
                    : 'border-transparent font-medium text-fg-3 hover:text-fg-2'
                }`}
              >
                {t(`detail.tabs.${key}`)}
              </button>
            );
          })}
        </div>

        {tab === 'documents' && (
          <DocumentList
            petId={pet.id}
            emptyState={
              <TabPlaceholder
                icon={<FileIcon className="h-9 w-9 text-brand" />}
                iconBg="bg-brand-tint"
                title={t('detail.documents.emptyTitle')}
                description={t('detail.documents.emptyDescription')}
              >
                <Link
                  href={`/pets/${pet.id}/scan`}
                  className="ph-btn ph-btn-primary mt-3.5 flex items-center gap-2 rounded-md bg-brand px-[22px] py-3.5 text-[15.5px] font-semibold text-white shadow-brand"
                >
                  <ScanIcon className="h-[19px] w-[19px]" />
                  {t('scanDocument')}
                </Link>
              </TabPlaceholder>
            }
          />
        )}
        {tab === 'history' && (
          <TabPlaceholder
            icon={<ClockIcon className="h-9 w-9 text-fg-3" />}
            iconBg="bg-subtle"
            title={t('detail.comingSoon')}
            description={t('detail.historySoon', { name: pet.name })}
          />
        )}
        {tab === 'reminders' && (
          <TabPlaceholder
            icon={<BellIcon className="h-9 w-9 text-accent" />}
            iconBg="bg-accent-tint"
            title={t('detail.comingSoon')}
            description={t('detail.remindersSoon', { name: pet.name })}
          />
        )}
      </div>

      {dialog === 'edit' && (
        <PetFormModal
          householdId={pet.householdId}
          pet={pet}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'delete' && (
        <DeletePetDialog
          pet={pet}
          onClose={() => setDialog(null)}
          onDeleted={() => router.replace('/')}
        />
      )}
    </div>
  );
}

/** Centered avatar, display name and attribute chips. */
function PetHeader({ pet }: { pet: Pet }) {
  const t = useTranslations('pets');
  const format = useFormatter();
  const age = petAge(pet);

  const ageLabel = t(age.unit === 'years' ? 'ageYears' : 'ageMonths', {
    count: age.value,
  });
  const birthLabel = format.dateTime(new Date(pet.birthDate), {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center px-6 pt-1.5 text-center">
      {/* Rounded-square avatar; a real photo will come with document storage. */}
      <div className="flex h-[108px] w-[108px] items-center justify-center rounded-xl border-[3px] border-surface bg-green-50 shadow-md">
        <PetIcon className="h-12 w-12 text-green-500" />
      </div>
      <h1 className="mt-3.5 font-display text-[34px] leading-tight tracking-[-0.01em] text-fg-1">
        {pet.name}
      </h1>

      <div className="mt-3 flex max-w-[360px] flex-wrap justify-center gap-[7px]">
        <Chip icon={<PetIcon className="h-[13px] w-[13px]" />}>
          {t(`species.${pet.species}`)}
        </Chip>
        {pet.breed && (
          <Chip icon={<TagIcon className="h-[13px] w-[13px]" />}>
            {pet.breed}
          </Chip>
        )}
        {pet.sex && (
          <Chip
            icon={
              pet.sex === 'MALE' ? (
                <MarsIcon className="h-[13px] w-[13px]" />
              ) : (
                <VenusIcon className="h-[13px] w-[13px]" />
              )
            }
          >
            {t(`sex.${pet.sex}`)}
          </Chip>
        )}
        <Chip icon={<CalendarIcon className="h-[13px] w-[13px]" />}>
          {`${ageLabel} · ${birthLabel}`}
        </Chip>
        {pet.weightKg != null && (
          <Chip icon={<WeightIcon className="h-[13px] w-[13px]" />}>
            {t('detail.weightValue', {
              weight: format.number(pet.weightKg, {
                maximumFractionDigits: 1,
              }),
            })}
          </Chip>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-[11px] py-[5px] text-[12.5px] font-medium text-fg-2">
      <span className="text-fg-3">{icon}</span>
      {children}
    </span>
  );
}

/** Kebab dropdown with the edit / delete pet actions. */
function PetActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('pets.detail');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={t('menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
      >
        <KebabIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 w-48 rounded-md border border-border bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onEdit)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-fg-1 transition hover:bg-subtle"
          >
            <PencilIcon className="h-[18px] w-[18px] text-fg-2" />
            {t('edit')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onDelete)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-danger transition hover:bg-subtle"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Centered illustration + title + description used by every tab for now. */
function TabPlaceholder({
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      className="flex flex-col items-center gap-2 px-8 pb-20 pt-14 text-center"
    >
      <div
        className={`mb-1.5 flex h-[88px] w-[88px] items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </div>
      <h2 className="text-[19px] font-semibold text-fg-1">{title}</h2>
      <p className="max-w-[290px] text-[14.5px] leading-relaxed text-fg-2">
        {description}
      </p>
      {children}
    </div>
  );
}
