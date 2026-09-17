import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/login-form';
import { Breadcrumbs } from '@/components/product/breadcrumbs';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sign in' }]} />

      <div className="mx-auto mt-10 max-w-md">
        <h1 className="font-display text-display-sm text-ink-900">Sign in</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          Enter your email and we will send you a code.
        </p>

        <div className="mt-8">
          {/* useSearchParams needs a Suspense boundary, or the whole route is
              forced to render dynamically. */}
          <Suspense fallback={<div className="h-56 animate-pulse rounded-md bg-paper-200" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
