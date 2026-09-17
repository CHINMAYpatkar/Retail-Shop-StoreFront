import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { CartView } from '@/components/cart/cart-view';

export const metadata: Metadata = {
  title: 'Your bag',
  // A cart is per-visitor and has nothing to index.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Your bag' }]} />

      <h1 className="mt-8 font-display text-display-sm text-ink-900 sm:text-display-md">
        Your bag
      </h1>

      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
