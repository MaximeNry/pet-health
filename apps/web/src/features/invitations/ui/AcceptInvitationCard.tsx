'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { googleLoginUrlFor, useLogout, useSession } from '@/features/auth';
import { ApiError } from '@/shared/api/apiClient';
import { AlertTriangleIcon, CheckIcon, PawMark } from '@/shared/ui/icons';
import { useAcceptInvitation } from '../model/useAcceptInvitation';

/**
 * Redeems an invitation link. Unauthenticated visitors go through Google
 * OAuth first (the `returnTo` parameter brings them back here, token intact);
 * authenticated ones redeem immediately. Every API rejection gets a dedicated
 * screen — most importantly 403, which tells the visitor which Google account
 * the invitation was issued for.
 */
export function AcceptInvitationCard({ token }: { token: string }) {
  const t = useTranslations('invite.accept');
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();
  const accept = useAcceptInvitation();

  const user = session.data ?? null;
  const returnTo = `/invite/${token}`;

  // Redeem exactly once per mount once the session is known (the ref guards
  // against React Strict Mode's double effect run).
  const fired = useRef(false);
  const { mutate: acceptMutate } = accept;
  useEffect(() => {
    if (session.isLoading || user === null || fired.current) return;
    fired.current = true;
    acceptMutate(token);
  }, [session.isLoading, user, token, acceptMutate]);

  // Land on the dashboard (the household) shortly after success.
  useEffect(() => {
    if (!accept.isSuccess) return;
    const timer = setTimeout(() => router.push('/'), 1800);
    return () => clearTimeout(timer);
  }, [accept.isSuccess, router]);

  async function switchAccount() {
    await logout.mutateAsync();
    window.location.href = googleLoginUrlFor(returnTo);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-md">
        {session.isLoading || accept.isPending ? (
          <CardBody icon="brand" title={t('pendingTitle')} text={t('pending')} />
        ) : user === null ? (
          <>
            <CardBody
              icon="brand"
              title={t('signInTitle')}
              text={t('signInText')}
            />
            <a
              href={googleLoginUrlFor(returnTo)}
              className="ph-btn ph-btn-primary mt-6 flex w-full items-center justify-center rounded-md bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-brand"
            >
              {t('signInCta')}
            </a>
          </>
        ) : accept.isSuccess ? (
          <>
            <CardBody
              icon="success"
              title={t('successTitle', { household: accept.data.name })}
              text={t('successText')}
            />
            <button
              type="button"
              onClick={() => router.push('/')}
              className="ph-btn ph-btn-primary mt-6 w-full rounded-md bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-brand"
            >
              {t('goToHousehold')}
            </button>
          </>
        ) : accept.isError ? (
          <AcceptError
            error={accept.error}
            signedInEmail={user.email}
            onSwitchAccount={switchAccount}
            switching={logout.isPending}
            onGoHome={() => router.push('/')}
          />
        ) : null}
      </div>
    </main>
  );
}

function AcceptError({
  error,
  signedInEmail,
  onSwitchAccount,
  switching,
  onGoHome,
}: {
  error: unknown;
  signedInEmail: string;
  onSwitchAccount: () => void;
  switching: boolean;
  onGoHome: () => void;
}) {
  const t = useTranslations('invite.accept');
  const status = error instanceof ApiError ? error.status : 0;

  if (status === 403) {
    const invitedEmail =
      error instanceof ApiError && typeof error.details?.invitedEmail === 'string'
        ? error.details.invitedEmail
        : null;
    return (
      <>
        <CardBody
          icon="warning"
          title={t('wrongAccountTitle')}
          text={
            invitedEmail !== null
              ? t('wrongAccountText', { invitedEmail, signedInEmail })
              : t('wrongAccountTextNoEmail', { signedInEmail })
          }
        />
        <button
          type="button"
          disabled={switching}
          onClick={onSwitchAccount}
          className="ph-btn ph-btn-primary mt-6 w-full rounded-md bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-brand disabled:opacity-60"
        >
          {t('switchAccount')}
        </button>
      </>
    );
  }

  const key =
    status === 409 ? 'alreadyUsed' : status === 410 ? 'expired' : 'invalid';
  return (
    <>
      <CardBody icon="warning" title={t(`${key}Title`)} text={t(`${key}Text`)} />
      <button
        type="button"
        onClick={onGoHome}
        className="ph-btn mt-6 w-full rounded-md border border-border-strong bg-surface px-4 py-3 text-[15px] font-semibold text-fg-1 transition hover:bg-subtle"
      >
        {t('goHome')}
      </button>
    </>
  );
}

function CardBody({
  icon,
  title,
  text,
}: {
  icon: 'brand' | 'success' | 'warning';
  title: string;
  text: string;
}) {
  return (
    <>
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-pill ${
          icon === 'warning'
            ? 'bg-accent-tint text-coral-600'
            : icon === 'success'
              ? 'bg-brand-tint text-brand'
              : 'text-brand'
        }`}
      >
        {icon === 'brand' ? (
          <PawMark className="h-10 w-10" />
        ) : icon === 'success' ? (
          <CheckIcon className="h-7 w-7" />
        ) : (
          <AlertTriangleIcon className="h-7 w-7" />
        )}
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg-1">
        {title}
      </h1>
      <p className="mx-auto mt-2.5 max-w-xs text-sm leading-normal text-fg-2">
        {text}
      </p>
    </>
  );
}
