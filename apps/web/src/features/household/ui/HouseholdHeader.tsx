'use client';

import { useState } from 'react';
import type { Household } from '@/entities/household';
import { initials } from '@/entities/user';
import { accentAt } from '@/shared/lib/avatar';
import { ManageIcon } from '@/shared/ui/icons';
import { useHouseholdMembers } from '../model/useHouseholdMembers';
import { ManageHouseholdModal } from './ManageHouseholdModal';

/** Household header: label, name, member avatar stack and a manage action. */
export function HouseholdHeader({ household }: { household: Household }) {
  const memberProfiles = useHouseholdMembers(household.members);
  const count = household.members.length;
  const [isManageOpen, setIsManageOpen] = useState(false);

  return (
    <div className="mb-8 border-b border-border pb-7">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg-3">
        Votre foyer
      </div>
      <div className="mb-4 font-display text-[42px] leading-none tracking-tight text-fg-1">
        {household.name}
      </div>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex">
            {household.members.slice(0, 4).map((member, index) => (
              <span
                key={member.userId}
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-canvas text-[12.5px] font-bold ${accentAt(index).chip} ${index > 0 ? '-ml-2.5' : ''}`}
              >
                {initials(memberProfiles[member.userId])}
              </span>
            ))}
          </div>
          <span className="text-sm text-fg-2">
            {count} {count > 1 ? 'membres' : 'membre'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsManageOpen(true)}
          className="ph-btn ph-btn-secondary flex items-center gap-2.5 whitespace-nowrap rounded-md border border-border bg-surface px-[18px] py-[11px] text-[14.5px] font-semibold text-fg-1"
        >
          <ManageIcon className="h-[18px] w-[18px] text-fg-2" />
          Gérer le foyer
        </button>
      </div>

      {isManageOpen && (
        <ManageHouseholdModal
          household={household}
          onClose={() => setIsManageOpen(false)}
        />
      )}
    </div>
  );
}
