'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCartStore, cartCount, cartSubtotal } from '@/store/cart-store';
import { Media } from '@/components/ui/media';
import { EmptyState } from '@/components/shop/empty-state';
import { QuantityStepper } from './quantity-stepper';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { ServerCartView } from './server-cart-view';

/**
 * The guest cart.
 *
 * Renders nothing meaningful until the store reports it has rehydrated. During
 * SSR the cart is unknowable, so showing "your bag is empty" and then swapping
 * to three items would be both a hydration mismatch and a horrible flicker -
 * the skeleton below holds the space instead.
 *
 * Every price here is the DISPLAY snapshot taken when the item was added. It is
 * never sent anywhere: on sign-in only product ids and quantities are replayed
 * to the server, which re-reads the real price. That is why the total carries
 * an explicit note rather than reading as a binding quote.
 */
export function CartView() {
  const status = useAuthStore((state) => state.status);
  const hydrated = useCartStore((state) => state.hydrated);
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);

  // Once signed in the basket lives server-side, and that view is the
  // authoritative one - real prices, real stock. The guest cart below is only
  // for visitors who have not signed in yet.
  if (status === 'authenticated') return <ServerCartView />;

  // `unknown` means the session has not been restored yet. Rendering the guest
  // cart now would show an empty bag to a signed-in customer for a moment and
  // then swap - so hold the space instead.
  if (status === 'unknown' || !hydrated) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Nothing in here yet. The shelf changes as we grind, so it is worth a look."
        actionHref="/shop"
        actionLabel="Browse the shelf"
      />
    );
  }

  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-paper-300 border-y border-paper-300">
        {lines.map((line) => (
          <li key={`${line.productId}-${line.variantId ?? 'base'}`} className="flex gap-4 py-5">
            <Link
              href={`/shop/${line.slug}`}
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-paper-200"
            >
              <Media src={line.imageUrl} alt="" sizes="80px" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/shop/${line.slug}`}
                  className="font-display text-lg leading-snug text-ink-900 transition-colors hover:text-gold-700"
                >
                  {line.name}
                </Link>
                <span className="shrink-0 font-data text-sm text-ink-900" data-numeric>
                  {formatPrice(line.price)}
                </span>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-3">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(next) => setQuantity(line.productId, line.variantId, next)}
                  label={`Quantity for ${line.name}`}
                />
                <button
                  type="button"
                  onClick={() => remove(line.productId, line.variantId)}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-ink-500 transition-colors hover:bg-paper-200 hover:text-chilli-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-paper-300 bg-paper-50 p-5">
          <h2 className="font-display text-lg text-ink-900">Summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">
                {count} {count === 1 ? 'item' : 'items'}
              </dt>
              <dd className="font-data text-ink-900" data-numeric>
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery</dt>
              <dd className="text-ink-500">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-paper-300 pt-4">
            <span className="font-medium text-ink-900">Subtotal</span>
            <span className="font-data font-medium text-ink-900" data-numeric>
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href="/account/login?next=/checkout"
            className="mt-5 flex w-full items-center justify-center rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400"
          >
            Sign in to check out
          </Link>

          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            Prices are confirmed when you check out. Payment is cash on delivery.
          </p>
        </div>
      </aside>
    </div>
  );
}

/** Holds the layout while the cart is read from storage. */
function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]" aria-busy="true" aria-label="Loading your bag">
      <ul className="divide-y divide-paper-300 border-y border-paper-300">
        {[0, 1].map((row) => (
          <li key={row} className="flex gap-4 py-5">
            <div className="h-24 w-20 shrink-0 animate-pulse rounded-md bg-paper-200" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-5 w-2/3 animate-pulse rounded bg-paper-200" />
              <div className="h-10 w-32 animate-pulse rounded bg-paper-200" />
            </div>
          </li>
        ))}
      </ul>
      <div className="h-64 animate-pulse rounded-lg bg-paper-200" />
    </div>
  );
}
