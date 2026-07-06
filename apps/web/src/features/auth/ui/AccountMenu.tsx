'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/entities/user';
import { displayName, initials } from '@/entities/user';
import {
  ChevronDownIcon,
  LogoutIcon,
  UserIcon,
} from '@/shared/ui/icons';
import { useCurrentUserProfile } from '../model/useCurrentUserProfile';
import { useLogout } from '../model/useLogout';

/** Account dropdown: shows the current user and offers profile/logout actions. */
export function AccountMenu({ user }: { user: AuthUser }) {
  const t = useTranslations('account');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useCurrentUserProfile(user.userId);
  const logout = useLogout();

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

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => router.replace('/login'),
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-pill border border-border py-1.5 pl-1.5 pr-2 transition hover:bg-subtle"
      >
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-green-100 text-[13px] font-bold text-green-700">
          {initials(profile, user.email)}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-fg-3" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-10 w-52 rounded-md border border-border bg-surface p-1.5 shadow-lg"
        >
          <div className="flex flex-col gap-px px-2.5 pb-2 pt-2.5">
            <span className="text-sm font-semibold text-fg-1">
              {displayName(profile, user.email)}
            </span>
            <span className="text-[12.5px] text-fg-3">{user.email}</span>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-fg-1 transition hover:bg-subtle"
          >
            <UserIcon className="h-[18px] w-[18px] text-fg-2" />
            {t('profile')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-coral-600 transition hover:bg-subtle disabled:opacity-60"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
