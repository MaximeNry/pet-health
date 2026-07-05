import { LoginCard } from '@/features/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  // The API redirects here with `?error=…` when the Google flow fails.
  const { error } = await searchParams;
  return <LoginCard hasError={Boolean(error)} />;
}
