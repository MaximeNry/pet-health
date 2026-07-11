'use client';

import { use } from 'react';
import { AcceptInvitationCard } from '@/features/invitations';

/**
 * Invitation landing route (`/invite/:token`) — the URL people receive on
 * WhatsApp. No session guard here: the card itself sends anonymous visitors
 * through Google OAuth and returns them to this exact URL.
 */
export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <AcceptInvitationCard token={token} />;
}
