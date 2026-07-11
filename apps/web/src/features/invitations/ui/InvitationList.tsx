'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { Invitation } from '../api/types';
import { useRevokeInvitation } from '../model/useRevokeInvitation';

/** How an invitation is displayed; EXPIRED is derived, never stored. */
type DisplayStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

function displayStatus(invitation: Invitation): DisplayStatus {
  if (
    invitation.status === 'PENDING' &&
    new Date(invitation.expiresAt).getTime() < Date.now()
  ) {
    return 'EXPIRED';
  }
  return invitation.status;
}

const PILL_CLASSES: Record<DisplayStatus, string> = {
  PENDING: 'text-[oklch(0.52_0.12_75)] bg-[oklch(0.96_0.05_85)]',
  ACCEPTED: 'text-green-700 bg-brand-tint',
  REVOKED: 'text-stone-600 bg-stone-100',
  EXPIRED: 'text-stone-600 bg-stone-100',
};

/**
 * The household's invitations with their status pill. Only pending ones can
 * be revoked (the action turns coral on hover, per the mockup).
 */
export function InvitationList({
  invitations,
  householdId,
}: {
  invitations: Invitation[];
  householdId: string;
}) {
  const t = useTranslations('invite.list');
  const format = useFormatter();
  const revokeInvitation = useRevokeInvitation(householdId);

  if (invitations.length === 0) {
    return <p className="text-sm text-fg-3">{t('empty')}</p>;
  }

  function caption(invitation: Invitation, status: DisplayStatus): string {
    switch (status) {
      case 'PENDING':
        return t('expiresIn', {
          // Explicit `now`: avoids next-intl's ENVIRONMENT_FALLBACK warning.
          relative: format.relativeTime(
            new Date(invitation.expiresAt),
            new Date(),
          ),
        });
      case 'ACCEPTED':
        return t('acceptedOn', {
          date: format.dateTime(
            new Date(invitation.acceptedAt ?? invitation.createdAt),
            { day: 'numeric', month: 'long' },
          ),
        });
      case 'REVOKED':
      case 'EXPIRED':
        return t('invitedOn', {
          date: format.dateTime(new Date(invitation.createdAt), {
            day: 'numeric',
            month: 'long',
          }),
        });
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {invitations.map((invitation, index) => {
        const status = displayStatus(invitation);
        const inactive = status === 'REVOKED' || status === 'EXPIRED';
        return (
          <div
            key={invitation.id}
            className={`flex items-center gap-2 px-3.5 py-[13px] ${
              index < invitations.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={`truncate text-sm ${
                  inactive
                    ? 'font-medium text-fg-3 line-through'
                    : 'font-semibold text-fg-1'
                }`}
              >
                {invitation.invitedEmail}
              </span>
              <span className="text-xs text-fg-3">
                {caption(invitation, status)}
              </span>
            </div>
            <span
              className={`flex-none rounded-pill px-2 py-[3px] text-[11px] font-semibold ${PILL_CLASSES[status]}`}
            >
              {t(`status.${status}`)}
            </span>
            {status === 'PENDING' && (
              <button
                type="button"
                disabled={revokeInvitation.isPending}
                onClick={() => revokeInvitation.mutate(invitation.id)}
                className="flex-none cursor-pointer rounded-pill border border-border bg-transparent px-[11px] py-[7px] text-xs font-semibold text-fg-3 transition hover:border-coral-100 hover:bg-coral-50 hover:text-coral-600 disabled:opacity-50"
              >
                {t('revoke')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
