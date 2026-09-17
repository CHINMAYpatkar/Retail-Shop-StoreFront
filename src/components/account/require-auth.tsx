'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-side guard for account pages.
 *
 * Deliberately NOT a security boundary — every one of these pages gets its data
 * from endpoints behind `JwtCustomerAuthGuard`, so the real enforcement is
 * server-side and unaffected by anything the browser does. This exists so a
 * signed-out visitor gets a sign-in page instead of a screen full of failed
 * requests.
 *
 * The `unknown` state matters: the access token is memory-only, so on every
 * page load the app briefly does not know who the customer is. Treating that as
 * signed-out would bounce a signed-in customer to the login page on every
 * refresh.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        aria-busy="true"
        aria-label="Checking your session"
      >
        <Loader2 className="h-5 w-5 animate-spin text-ink-300" />
      </div>
    );
  }

  return <>{children}</>;
}
