'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

/**
 * The header account link.
 *
 * Points at `/account` when signed in and `/account/login` otherwise, so the
 * icon always goes somewhere useful rather than bouncing through a guard.
 *
 * While the session is still `unknown` it renders the signed-out destination
 * but without the "signed in" styling. The alternative - rendering nothing
 * until resolved - makes the header visibly reflow on every page load, and
 * guessing "signed in" would flash an account page at a visitor who is not.
 */
export function AccountLink({ className }: { className?: string }) {
  const status = useAuthStore((state) => state.status);
  const customer = useAuthStore((state) => state.customer);

  const signedIn = status === 'authenticated';
  const name = customer?.name?.split(' ')[0];

  return (
    <Link
      href={signedIn ? '/account' : '/account/login'}
      aria-label={signedIn ? `Account, signed in as ${customer?.email}` : 'Sign in'}
      className={cn(
        'relative inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900',
        className,
      )}
    >
      <User className="h-[18px] w-[18px]" />
      {signedIn && name ? (
        <span className="hidden max-w-20 truncate text-sm xl:inline">{name}</span>
      ) : null}
      {signedIn ? (
        <span
          aria-hidden
          className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-500"
        />
      ) : null}
    </Link>
  );
}
