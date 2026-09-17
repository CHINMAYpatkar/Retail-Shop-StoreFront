'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { MotionProvider } from '@/components/motion';
import { AuthProvider } from '@/components/account/auth-provider';

/**
 * Client-side providers.
 *
 * Most of the storefront is server-rendered and cached (ADR 0010), so React
 * Query is here only for the genuinely interactive parts: cart, wishlist,
 * account, and anything behind customer auth. Catalogue data does not pass
 * through it.
 *
 * The client is created inside `useState` rather than at module scope. A
 * module-scoped client is shared across every request on the server, which
 * leaks one visitor's cached data into another's render.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cart and account data is per-customer and small; refetching on
            // focus is cheap and avoids showing a stale basket after the
            // customer has changed it in another tab.
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'font-sans text-sm',
            },
          }}
        />
      </MotionProvider>
    </QueryClientProvider>
  );
}
