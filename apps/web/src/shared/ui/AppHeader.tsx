import type { ReactNode } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PawMark } from './icons';

/**
 * App shell header: PetHealth wordmark on the left, the language switcher and
 * a caller-provided action slot (e.g. the account menu) on the right.
 */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-[68px] flex-none items-center justify-between border-b border-border bg-surface px-8">
      <div className="flex items-center gap-2.5">
        <PawMark className="h-[26px] w-[26px] text-brand" />
        <span className="text-xl font-bold tracking-tight text-fg-1">
          Pet<span className="text-brand">Health</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {children}
      </div>
    </header>
  );
}
