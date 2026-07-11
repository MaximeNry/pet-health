'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Household, HouseholdRole } from '@/entities/household';
import { HOUSEHOLD_ROLES } from '@/entities/household';
import { displayName, initials } from '@/entities/user';
import { accentAt } from '@/shared/lib/avatar';
import { CloseIcon, TrashIcon } from '@/shared/ui/icons';
import { useChangeMemberRole } from '../model/useChangeMemberRole';
import { useHouseholdMembers } from '../model/useHouseholdMembers';
import { useRemoveMember } from '../model/useRemoveMember';

/**
 * "Household members" dialog: lists members with their role (editable) and
 * lets members be removed. New members join through the invitation-link
 * screen (`/household/invite`), which this dialog links to. The current user
 * cannot remove themselves.
 */
export function HouseholdMembersModal({
  household,
  currentUserId,
  onClose,
}: {
  household: Household;
  currentUserId: string;
  onClose: () => void;
}) {
  const t = useTranslations('household.members');
  const memberProfiles = useHouseholdMembers(household.members);

  const changeMemberRole = useChangeMemberRole(household.id);
  const removeMember = useRemoveMember(household.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className="flex w-[440px] max-w-full flex-col overflow-hidden rounded-[24px] bg-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-[22px]">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-fg-1">
              {t('title')}
            </h2>
            <p className="text-sm text-fg-2">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="-mr-1.5 flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center rounded-full bg-subtle text-fg-2 transition hover:bg-border hover:text-fg-1"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col px-6 pt-2">
          {/* Members list */}
          <div className="flex flex-col">
            {household.members.map((member, index) => {
              const profile = memberProfiles[member.userId];
              const isYou = member.userId === currentUserId;
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-2 border-b border-border py-[13px]"
                >
                  <span
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold ${accentAt(index).chip}`}
                  >
                    {initials(profile)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-fg-1">
                        {displayName(profile)}
                      </span>
                      {isYou && (
                        <span className="flex-none whitespace-nowrap text-[13px] font-semibold text-green-600">
                          {t('you')}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[12.5px] text-fg-3">
                      {profile?.email}
                    </span>
                  </div>
                  {/* Role badge dropped on purpose: the select right beside it
                      already shows the role. */}
                  <select
                    value={member.role}
                    aria-label={t('roleLabel')}
                    disabled={changeMemberRole.isPending}
                    onChange={(e) =>
                      changeMemberRole.mutate({
                        userId: member.userId,
                        role: e.target.value as HouseholdRole,
                      })
                    }
                    className="flex-none cursor-pointer rounded-[10px] border border-border-strong bg-surface py-[7px] pl-2 pr-1 text-[13px] font-medium text-fg-1 outline-none"
                  >
                    {HOUSEHOLD_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`roles.${role}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={t('remove')}
                    title={t('remove')}
                    disabled={isYou || removeMember.isPending}
                    onClick={() => removeMember.mutate(member.userId)}
                    className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-coral-500 transition enabled:cursor-pointer enabled:hover:bg-coral-50 enabled:hover:text-coral-600 disabled:opacity-35"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {(changeMemberRole.isError || removeMember.isError) && (
            <p role="alert" className="pt-3 text-sm font-medium text-coral-700">
              {t('error')}
            </p>
          )}

          {/* Invite section: points to the invitation-link screen */}
          <div className="flex flex-col gap-2.5 pt-5">
            <h3 className="text-base font-semibold tracking-tight text-fg-1">
              {t('inviteTitle')}
            </h3>
            <p className="text-sm leading-normal text-fg-3">
              {t('inviteHint')}
            </p>
            <Link
              href="/household/invite"
              className="ph-btn ph-btn-primary flex items-center justify-center rounded-md bg-brand px-4 py-[13px] text-[15px] font-semibold text-white shadow-brand"
            >
              {t('inviteCta')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-border p-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="ph-btn w-full rounded-md border border-border-strong bg-surface px-4 py-[13px] text-[15px] font-semibold text-fg-1 transition hover:bg-subtle"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
