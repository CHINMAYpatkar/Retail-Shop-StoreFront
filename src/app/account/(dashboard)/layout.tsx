import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/account-nav';
import { RequireAuth } from '@/components/account/require-auth';

/**
 * Shell for the signed-in account pages.
 *
 * This is a route GROUP, so it adds nothing to the URL - `/account`,
 * `/account/orders` and so on - but it scopes the guard to exactly these pages.
 *
 * `/account/login` and `/account/complete` sit outside it on purpose. A layout
 * at `app/account/` would wrap them too, which would put the sign-in page
 * behind a sign-in check: a signed-out visitor would be redirected to the page
 * they are already on, forever.
 *
 * The guard lives here rather than in each page so a new account page cannot be
 * added without it - the failure mode of per-page guards is the one page
 * somebody forgets.
 */
export default function AccountDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell py-8 sm:py-12">
      <RequireAuth>
        <div className="grid gap-10 lg:grid-cols-[13rem_1fr]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </RequireAuth>
    </div>
  );
}
