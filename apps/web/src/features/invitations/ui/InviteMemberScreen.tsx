'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Household } from '@/entities/household';
import {
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  WhatsAppIcon,
} from '@/shared/ui/icons';
import type { CreatedInvitation } from '../api/types';
import { useCreateInvitation } from '../model/useCreateInvitation';
import { useInvitations } from '../model/useInvitations';
import { InvitationList } from './InvitationList';

/**
 * "Invite a member" screen. Two states, per the mockup: the email form, then
 * — once the link is generated — a success card whose primary action is
 * sharing on WhatsApp (the user delivers the link themself; no email is
 * sent). Below, the household's invitations with their statuses.
 */
export function InviteMemberScreen({ household }: { household: Household }) {
  const t = useTranslations('invite');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);

  const invitations = useInvitations(household.id);
  const createInvitation = useCreateInvitation(household.id);

  const emailReady = email.trim().includes('@');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!emailReady || createInvitation.isPending) return;
    createInvitation.mutate(
      { invitedEmail: email },
      {
        onSuccess: (result) => {
          setCreated(result);
          setEmail('');
        },
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-10 pt-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t('back')}
          onClick={() => router.push('/')}
          className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-pill bg-subtle text-fg-2 transition hover:bg-border hover:text-fg-1"
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold tracking-tight text-fg-1">
            {t('title')}
          </h1>
          <span className="text-[13px] text-fg-3">{household.name}</span>
        </div>
      </div>

      {created === null ? (
        /* State 1 — email form */
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-[18px]"
        >
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">
              {t('emailLabel')}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="ph-input w-full rounded-md border border-border-strong bg-surface px-3.5 py-[13px] text-base text-fg-1 outline-none transition"
            />
            <p className="text-[13px] leading-normal text-fg-3">
              {t('emailHint')}
            </p>
          </label>
          {createInvitation.isError && (
            <p role="alert" className="text-sm font-medium text-coral-700">
              {t('createError')}
            </p>
          )}
          <button
            type="submit"
            disabled={!emailReady || createInvitation.isPending}
            className="ph-btn ph-btn-primary min-h-12 w-full rounded-md bg-brand px-4 py-3.5 text-[15px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:bg-green-200 disabled:shadow-none"
          >
            {createInvitation.isPending ? t('submitPending') : t('submit')}
          </button>
        </form>
      ) : (
        /* State 2 — link generated, WhatsApp share first */
        <InvitationLinkCard
          created={created}
          householdName={household.name}
          onInviteAnother={() => setCreated(null)}
        />
      )}

      {/* Invitations with their statuses */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold text-fg-1">
          {t('list.title')}
        </h2>
        {invitations.isLoading ? (
          <p className="text-sm text-fg-3">{t('list.loading')}</p>
        ) : invitations.isError ? (
          <p role="alert" className="text-sm font-medium text-coral-700">
            {t('list.error')}
          </p>
        ) : (
          <InvitationList
            invitations={invitations.data ?? []}
            householdId={household.id}
          />
        )}
      </div>
    </div>
  );
}

function InvitationLinkCard({
  created,
  householdName,
  onInviteAnother,
}: {
  created: CreatedInvitation;
  householdName: string;
  onInviteAnother: () => void;
}) {
  const t = useTranslations('invite.link');
  const format = useFormatter();
  const [copied, setCopied] = useState(false);

  const { link, invitation } = created;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareOnWhatsApp() {
    const text = `${t('shareMessage', { household: householdName })} ${link}`;
    // Prefer the native share sheet (mobile); fall back to WhatsApp's URL
    // scheme on desktop browsers without navigator.share.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Cancelled or unsupported payload — fall through to wa.me.
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-green-100 bg-surface p-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-pill bg-brand-tint text-brand">
          <CheckIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[15px] font-semibold text-fg-1">
          {t('ready')}
        </span>
      </div>

      {/* The link, with an inline copy shortcut */}
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-subtle py-1 pl-3.5 pr-1">
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">
          {link}
        </span>
        <button
          type="button"
          aria-label={t('copy')}
          title={t('copy')}
          onClick={copyLink}
          className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center rounded-[11px] border border-border bg-surface text-fg-2 transition hover:bg-subtle hover:text-fg-1"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-brand" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* WhatsApp is the primary action: the link is delivered by hand */}
      <button
        type="button"
        onClick={shareOnWhatsApp}
        className="flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-md bg-[#25D366] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(37,211,102,0.35)] transition hover:bg-[#1FB858] active:scale-[0.98]"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t('whatsapp')}
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="ph-btn w-full rounded-md border border-border-strong bg-surface px-4 py-3 text-[15px] font-semibold text-fg-1 transition hover:bg-subtle"
      >
        {copied ? t('copied') : t('copy')}
      </button>

      <p className="text-center text-xs leading-normal text-fg-3">
        {t.rich('restrictedTo', {
          email: invitation.invitedEmail,
          // Explicit `now`: avoids next-intl's ENVIRONMENT_FALLBACK warning.
          expires: format.relativeTime(
            new Date(invitation.expiresAt),
            new Date(),
          ),
          strong: (chunks) => (
            <span className="font-semibold text-fg-2">{chunks}</span>
          ),
        })}
      </p>

      <button
        type="button"
        onClick={onInviteAnother}
        className="cursor-pointer self-center text-[13px] font-semibold text-brand transition hover:text-brand-hover"
      >
        {t('inviteAnother')}
      </button>
    </div>
  );
}
