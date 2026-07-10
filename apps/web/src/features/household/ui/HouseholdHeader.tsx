'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Household } from '@/entities/household';
import { initials } from '@/entities/user';
import { accentAt } from '@/shared/lib/avatar';
import { ChevronRightIcon, ManageIcon } from '@/shared/ui/icons';
import { useHouseholdMembers } from '../model/useHouseholdMembers';
import { HouseholdMembersModal } from './HouseholdMembersModal';
import { ManageHouseholdModal } from './ManageHouseholdModal';

/**
 * Household header: label, name, a clickable member pill (opens the members
 * dialog) and a manage action (opens the household settings dialog).
 */
export function HouseholdHeader({
  household,
  currentUserId,
}: {
  household: Household;
  currentUserId: string;
}) {
  const t = useTranslations('household');
  const memberProfiles = useHouseholdMembers(household.members);
  const count = household.members.length;
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  return (
    <div className="mb-8 border-b border-border pb-7">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg-3">
        {t('kicker')}
      </div>
      <div className="mb-4 font-display text-[42px] leading-none tracking-tight text-fg-1">
        {household.name}
      </div>
      <div className="flex items-center justify-between gap-6">
        <button
          type="button"
          aria-label={t('members.open')}
          onClick={() => setIsMembersOpen(true)}
          className="group flex cursor-pointer items-center gap-3 rounded-full border border-border bg-surface py-[7px] pl-2 pr-3 transition hover:border-border-strong hover:bg-subtle hover:shadow-sm"
        >
          <span className="flex">
            {household.members.slice(0, 4).map((member, index) => (
              <span
                key={member.userId}
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-surface text-[11.5px] font-bold ${accentAt(index).chip} ${index > 0 ? '-ml-2.5' : ''}`}
              >
                {initials(memberProfiles[member.userId])}
              </span>
            ))}
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-fg-1">
            {t('memberCount', { count })}
          </span>
          <ChevronRightIcon className="h-4 w-4 text-fg-3 transition group-hover:translate-x-0.5 group-hover:text-fg-1" />
        </button>

        <button
          type="button"
          onClick={() => setIsManageOpen(true)}
          className="ph-btn ph-btn-secondary flex items-center gap-2.5 whitespace-nowrap rounded-md border border-border bg-surface px-[18px] py-[11px] text-[14.5px] font-semibold text-fg-1"
        >
          <ManageIcon className="h-[18px] w-[18px] text-fg-2" />
          {t('manage')}
        </button>
      </div>

      {isManageOpen && (
        <ManageHouseholdModal
          household={household}
          onClose={() => setIsManageOpen(false)}
        />
      )}
      {isMembersOpen && (
        <HouseholdMembersModal
          household={household}
          currentUserId={currentUserId}
          onClose={() => setIsMembersOpen(false)}
        />
      )}
    </div>
  );
}
