'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { bootstrapAuth } from '@/lib/auth';
import { setSessionExpiredHandler } from '@/lib/customer-api';
import { useAuthStore } from '@/store/auth-store';

/**
 * Restores the session once, on load.
 *
 * The access token is memory-only (ADR 0015), so every page load begins not
 * knowing who the customer is and asks the refresh cookie. This runs at the
 * root so it happens once rather than per page.
 *
 * It renders children immediately rather than blocking. The storefront is
 * mostly public, and holding the whole site behind an auth check would make a
 * catalogue page wait on a request it does not need.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const bootstrapped = useRef(false);

  useEffect(() => {
    // Guarded as well as coalesced. `refreshAccessToken` already shares one
    // in-flight request, but running the whole bootstrap twice would still
    // fire a second `/me` for no reason - and StrictMode runs this twice in
    // development, which is how the double-refresh bug surfaced.
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrapAuth();
  }, []);

  useEffect(() => {
    // Fired when a refresh fails mid-session - the token expired and could not
    // be renewed. Telling the customer is much better than a page that quietly
    // stops working.
    setSessionExpiredHandler(() => {
      useAuthStore.getState().setAnonymous();
      toast.error('Your session has ended. Please sign in again.');
      router.push('/account/login');
    });

    return () => setSessionExpiredHandler(null);
  }, [router]);

  return <>{children}</>;
}
