'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/entities/user';
import { displayName, initials } from '@/entities/user';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  GoogleGIcon,
  LockIcon,
  LogoutIcon,
  TrashIcon,
} from '@/shared/ui/icons';
import { useCurrentUserProfile } from '../model/useCurrentUserProfile';
import { useDeleteAccount } from '../model/useDeleteAccount';
import { useLogout } from '../model/useLogout';

/**
 * "My account" screen (design: "Mon compte"): identity header, linked Google
 * account card, sign-out, and the delete-account danger zone.
 */
export function AccountScreen({ user }: { user: AuthUser }) {
  const t = useTranslations('account');
  const router = useRouter();
  const { data: profile } = useCurrentUserProfile(user.userId);
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => router.replace('/login'),
    });
  }

  function handleDelete() {
    deleteAccount.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    });
  }

  return (
    <div className="flex flex-1 justify-center overflow-y-auto px-6 pb-24 pt-6">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          aria-label={t('back')}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="mb-9 font-display text-[44px] leading-[1.05] tracking-tight text-fg-1">
          {t('title')}
        </h1>

        {/* Identity */}
        <div className="mb-10 flex items-center gap-[18px]">
          <span className="flex h-[68px] w-[68px] flex-none items-center justify-center rounded-pill bg-brand-tint text-2xl font-bold text-brand shadow-sm">
            {initials(profile, user.email)}
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-bold leading-tight tracking-tight text-fg-1">
              {displayName(profile, user.email)}
            </p>
            <p className="mt-[3px] truncate text-[15px] text-fg-2">
              {user.email}
            </p>
          </div>
        </div>

        {/* Linked Google account */}
        <section className="mb-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            {t('google.kicker')}
          </h2>
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md border border-border bg-stone-50">
              <GoogleGIcon className="h-[22px] w-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-semibold text-fg-1">
                {user.email}
              </p>
              <p className="mt-0.5 text-[13px] text-fg-3">{t('google.linked')}</p>
            </div>
            <span className="inline-flex flex-none items-center gap-1.5 rounded-pill bg-accent-tint px-3 py-1.5 text-[12.5px] font-semibold text-accent-hover">
              <span className="h-[7px] w-[7px] rounded-full bg-accent" />
              {t('google.connected')}
            </span>
          </div>
          <div className="mt-[18px] flex gap-2 border-t border-border pt-[18px] text-[13px] leading-normal text-fg-3">
            <LockIcon className="mt-px h-[15px] w-[15px] flex-none" />
            <span>{t('google.privacyNote')}</span>
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-surface p-3.5 text-[15.5px] font-semibold text-fg-1 shadow-sm transition hover:bg-subtle hover:shadow-md disabled:opacity-60"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          {t('logout')}
        </button>

        {/* Danger zone */}
        <section className="mt-14 rounded-lg border border-coral-200 bg-coral-50 p-6">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangleIcon className="h-[18px] w-[18px] text-danger" />
            <h2 className="text-[17px] font-bold tracking-tight text-stone-900">
              {t('delete.title')}
            </h2>
          </div>
          <p className="mb-5 max-w-[52ch] text-sm leading-normal text-fg-2">
            {t('delete.description')}
          </p>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-danger px-[22px] py-3 text-[15px] font-semibold text-white transition hover:bg-danger-hover active:scale-[0.98]"
          >
            <TrashIcon className="h-[17px] w-[17px]" />
            {t('delete.cta')}
          </button>
        </section>

        {confirmingDelete && (
          <ConfirmDeleteDialog
            title={t('delete.modal.title')}
            description={t('delete.modal.description')}
            cancelLabel={t('delete.modal.cancel')}
            confirmLabel={
              deleteAccount.isPending
                ? t('delete.modal.confirmPending')
                : t('delete.modal.confirm')
            }
            error={deleteAccount.isError ? t('delete.modal.error') : undefined}
            isPending={deleteAccount.isPending}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
