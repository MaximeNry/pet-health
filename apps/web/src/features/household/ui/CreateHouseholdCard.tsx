'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  PawMark,
  PetIcon,
  PlusIcon,
  UsersIcon,
} from '@/shared/ui/icons';
import { useCreateHousehold } from '../model/useCreateHousehold';

/**
 * Extracts the raw invitation token from whatever the user pasted: either a
 * full invite URL (`.../invite/<token>`) or the bare token on its own. Returns
 * `null` when nothing token-shaped is found. Tokens are base64url
 * (`randomBytes(32).toString('base64url')`), hence the `[A-Za-z0-9_-]` charset.
 */
function extractInviteToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/invite\/([A-Za-z0-9_-]+)/);
  if (fromUrl) return fromUrl[1];
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Empty state shown when the user belongs to no household yet: a guided,
 * two-panel card. The main path creates a household from a single name field;
 * a secondary path lets a user who already received an invitation link paste it
 * to join an existing household (redirects to `/invite/:token`). On successful
 * creation the households query is invalidated, so the dashboard swaps in.
 */
export function CreateHouseholdCard({ ownerId }: { ownerId: string }) {
  const t = useTranslations('household.create');
  const router = useRouter();
  const [name, setName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [joinError, setJoinError] = useState(false);
  const createHousehold = useCreateHousehold(ownerId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createHousehold.isPending) return;
    createHousehold.mutate(trimmed);
  }

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const token = extractInviteToken(inviteLink);
    if (!token) {
      setJoinError(true);
      return;
    }
    router.push(`/invite/${token}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex w-[780px] max-w-full overflow-hidden rounded-xl bg-surface shadow-lg">
        {/* Brand panel */}
        <div className="hidden w-80 flex-none flex-col bg-gradient-to-b from-green-500 to-green-700 p-[34px] py-10 text-white sm:flex">
          <PawMark className="h-10 w-10 opacity-95" />
          <div className="mb-7 mt-[22px] font-display text-3xl leading-tight tracking-tight">
            {t('brandHeadline')}
          </div>
          <ul className="mt-auto flex flex-col gap-[18px]">
            <FeatureRow icon={<PetIcon className="h-[18px] w-[18px]" />}>
              {t('featurePets')}
            </FeatureRow>
            <FeatureRow icon={<UsersIcon className="h-[18px] w-[18px]" />}>
              {t('featureMembers')}
            </FeatureRow>
            <FeatureRow icon={<BellIcon className="h-[18px] w-[18px]" />}>
              {t('featureReminders')}
            </FeatureRow>
          </ul>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 flex-col p-10 sm:p-11">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg-3">
            {t('kicker')}
          </div>
          <h1 className="mb-2 font-display text-[34px] leading-none tracking-tight text-fg-1">
            {t('title')}
          </h1>
          <p className="mb-7 text-[15.5px] leading-normal text-fg-2">
            {t('intro')}
          </p>

          <form onSubmit={handleSubmit}>
            <label className="mb-6 block">
              <span className="mb-2 block text-[13.5px] font-semibold text-fg-1">
                {t('nameLabel')}
              </span>
              <input
                className="ph-input w-full rounded-md border border-border-strong bg-surface px-[15px] py-3.5 text-base text-fg-1 outline-none transition"
                type="text"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
              />
              <span className="mt-2.5 block text-[13px] text-fg-3">
                {t('nameHint')}
              </span>
            </label>

            {createHousehold.isError && (
              <p role="alert" className="mb-3 text-sm font-medium text-coral-700">
                {t('error')}
              </p>
            )}

            <button
              type="submit"
              disabled={createHousehold.isPending || name.trim() === ''}
              className="ph-btn ph-btn-primary flex w-full items-center justify-center gap-2.5 rounded-md bg-brand px-6 py-[15px] text-base font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-[19px] w-[19px]" />
              {createHousehold.isPending ? t('submitPending') : t('submit')}
            </button>
          </form>

          {/* Divider between the create path and the join-via-link path */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-3">
              {t('orDivider')}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleJoin}>
            <label className="mb-4 block">
              <span className="mb-2 block text-[13.5px] font-semibold text-fg-1">
                {t('joinLabel')}
              </span>
              <input
                className="ph-input w-full rounded-md border border-border-strong bg-surface px-[15px] py-3.5 text-base text-fg-1 outline-none transition"
                type="text"
                value={inviteLink}
                onChange={(e) => {
                  setInviteLink(e.target.value);
                  if (joinError) setJoinError(false);
                }}
                placeholder={t('joinPlaceholder')}
              />
              {joinError ? (
                <span role="alert" className="mt-2.5 block text-[13px] font-medium text-coral-700">
                  {t('joinError')}
                </span>
              ) : (
                <span className="mt-2.5 block text-[13px] text-fg-3">
                  {t('joinHint')}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={extractInviteToken(inviteLink) === null}
              className="ph-btn flex w-full items-center justify-center gap-2.5 rounded-md border border-border-strong bg-surface px-6 py-[13px] text-base font-semibold text-fg-1 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UsersIcon className="h-[19px] w-[19px]" />
              {t('joinSubmit')}
            </button>
          </form>

          <div className="mt-4 text-center text-[13.5px] text-fg-3">
            {t('membersNote')}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-md bg-white/15 text-white">
        {icon}
      </span>
      <span className="text-[14.5px] leading-snug text-white/90">{children}</span>
    </li>
  );
}
