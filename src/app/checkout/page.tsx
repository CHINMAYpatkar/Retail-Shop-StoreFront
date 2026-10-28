import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { RequireAuth } from '@/components/account/require-auth';
import { CheckoutView } from '@/components/checkout/checkout-view';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Your bag', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      <h1 className="mt-8 font-display text-display-sm text-ink-900 sm:text-display-md">
        Checkout
      </h1>

      <div className="mt-10">
        {/* Signed-in only: the basket is server-side by this point, and the
            order needs an address that belongs to an account. */}
        <RequireAuth>
          <CheckoutView />
        </RequireAuth>
      </div>
    </div>
  );
}
