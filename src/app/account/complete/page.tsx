import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompleteProfileForm } from '@/components/account/complete-profile-form';
import { RequireAuth } from '@/components/account/require-auth';

export const metadata: Metadata = {
  title: 'Complete your account',
  robots: { index: false, follow: true },
};

export default function CompleteProfilePage() {
  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto mt-6 max-w-md">
        <h1 className="font-display text-display-sm text-ink-900">Almost there</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          Your email is verified. Just your name and a number to reach you on.
        </p>

        <div className="mt-8">
          <RequireAuth>
            <Suspense fallback={<div className="h-80 animate-pulse rounded-md bg-paper-200" />}>
              <CompleteProfileForm />
            </Suspense>
          </RequireAuth>
        </div>
      </div>
    </div>
  );
}
