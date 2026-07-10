'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Household, HouseholdRole } from '@/entities/household';
import { HOUSEHOLD_ROLES } from '@/entities/household';
import { displayName, initials } from '@/entities/user';
import { accentAt } from '@/shared/lib/avatar';
import { CloseIcon, TrashIcon } from '@/shared/ui/icons';
import { useChangeMemberRole } from '../model/useChangeMemberRole';
import { useHouseholdMembers } from '../model/useHouseholdMembers';
import { useInviteMember, UnknownUserError } from '../model/useInviteMember';
import { useRemoveMember } from '../model/useRemoveMember';

/**
 * "Household members" dialog: lists members with their role (editable), lets
 * an existing account be added by email ("invite" — the MVP has no real
 * invitation flow, see `useInviteMember`) and members be removed. The current
 * user cannot remove themselves.
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

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HouseholdRole>('MEMBER');

  const inviteMember = useInviteMember(household.id);
  const changeMemberRole = useChangeMemberRole(household.id);
  const removeMember = useRemoveMember(household.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const inviteReady = inviteEmail.trim().includes('@');

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteReady || inviteMember.isPending) return;
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      { onSuccess: () => setInviteEmail('') },
    );
  }

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
        className="flex w-[440px] max-w-full flex-col overflow-hidden rounded-[24px] bg-surface shadow-lg @container"
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
              const isOwner = member.role === 'OWNER';
              return (
                <div
                  key={member.userId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-border py-[13px]"
                >
                  <span
                    className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full text-sm font-bold ${accentAt(index).chip}`}
                  >
                    {initials(profile)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold text-fg-1">
                        {displayName(profile)}
                      </span>
                      <span
                        className={`flex-none whitespace-nowrap rounded-full px-[7px] py-0.5 text-[11px] font-semibold ${isOwner ? 'bg-coral-50 text-coral-600' : 'bg-subtle text-fg-2'}`}
                      >
                        {t(`roles.${member.role}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-fg-3">
                      <span className="truncate">{profile?.email}</span>
                      {isYou && (
                        <span className="whitespace-nowrap font-semibold text-green-600">
                          {t('you')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Below ~400px of modal width the controls wrap to their
                      own line, indented under the text (54px = avatar + gap),
                      so the name never gets crushed on phones. */}
                  <div className="flex w-full items-center justify-between gap-3 pl-[54px] @[400px]:w-auto @[400px]:pl-0">
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
                      className="flex-none cursor-pointer rounded-[12px] border border-border-strong bg-surface px-1.5 py-[9px] text-sm font-medium text-fg-1 outline-none"
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
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-coral-500 transition enabled:cursor-pointer enabled:hover:bg-coral-50 enabled:hover:text-coral-600 disabled:opacity-35"
                    >
                      <TrashIcon className="h-[17px] w-[17px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {(changeMemberRole.isError || removeMember.isError) && (
            <p role="alert" className="pt-3 text-sm font-medium text-coral-700">
              {t('error')}
            </p>
          )}

          {/* Invite section */}
          <form onSubmit={handleInvite} className="flex flex-col gap-3.5 pt-5">
            <h3 className="text-base font-semibold tracking-tight text-fg-1">
              {t('inviteTitle')}
            </h3>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-fg-2">
                {t('inviteEmailLabel')}
              </span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('inviteEmailPlaceholder')}
                className="ph-input w-full rounded-md border border-border-strong bg-surface px-3.5 py-3 text-[15px] text-fg-1 outline-none transition"
              />
            </label>
            <div className="flex items-end gap-2.5">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-fg-2">
                  {t('inviteRoleLabel')}
                </span>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as HouseholdRole)
                  }
                  className="cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-3 text-[15px] font-medium text-fg-1 outline-none"
                >
                  {HOUSEHOLD_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={!inviteReady || inviteMember.isPending}
                className="ph-btn ph-btn-primary flex-1 rounded-md bg-brand px-4 py-[13px] text-[15px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:bg-green-200 disabled:shadow-none"
              >
                {inviteMember.isPending
                  ? t('invitePending')
                  : t('inviteSubmit')}
              </button>
            </div>
            {inviteMember.isError && (
              <p role="alert" className="text-sm font-medium text-coral-700">
                {inviteMember.error instanceof UnknownUserError
                  ? t('inviteErrorNotFound')
                  : t('inviteError')}
              </p>
            )}
          </form>
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
