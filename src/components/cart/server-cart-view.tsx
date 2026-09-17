'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customerApi } from '@/lib/customer-api';
import { accountKeys, useServerCart } from '@/hooks/use-account';
import { Media } from '@/components/ui/media';
import { EmptyState } from '@/components/shop/empty-state';
import { QuantityStepper } from './quantity-stepper';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

/**
 * The cart for a signed-in customer.
 *
 * Once authenticated the basket lives server-side, so this is the authoritative
 * view: prices come from the database rather than from the display snapshot the
 * guest cart carries, and stock is whatever the server currently says.
 */
export function ServerCartView() {
  const { data: cart, isLoading } = useServerCart();
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: accountKeys.cart });

  const setQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      customerApi.patch(`/customer/cart/${itemId}`, { quantity }),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update that.')),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => customerApi.delete(`/customer/cart/${itemId}`),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error, 'Could not remove that.')),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-paper-200" aria-busy="true" />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Nothing in here yet. The shelf changes as we grind, so it is worth a look."
        actionHref="/shop"
        actionLabel="Browse the shelf"
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-paper-300 border-y border-paper-300">
        {cart.items.map((item) => {
          const outOfStock = item.product.stockQuantity <= 0;

          return (
            <li key={item.id} className="flex gap-4 py-5">
              <Link
                href={`/shop/${item.product.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-paper-200"
              >
                <Media src={item.product.images?.[0]?.url} alt="" sizes="80px" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="font-display text-lg leading-snug text-ink-900 transition-colors hover:text-gold-700"
                  >
                    {item.product.name}
                  </Link>
                  <span className="shrink-0 font-data text-sm text-ink-900" data-numeric>
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>

                {outOfStock ? (
                  <p className="text-sm text-chilli-400">
                    Out of stock — remove it to check out.
                  </p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <QuantityStepper
                    value={item.quantity}
                    max={Math.max(item.product.stockQuantity, 1)}
                    onChange={(quantity) =>
                      quantity <= 0
                        ? removeItem.mutate(item.id)
                        : setQuantity.mutate({ itemId: item.id, quantity })
                    }
                    label={`Quantity for ${item.product.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem.mutate(item.id)}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-ink-500 transition-colors hover:bg-paper-200 hover:text-chilli-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-paper-300 bg-paper-50 p-5">
          <h2 className="font-display text-lg text-ink-900">Summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </dt>
              <dd className="font-data text-ink-900" data-numeric>
                {formatPrice(cart.subtotal)}
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
              {formatPrice(cart.subtotal)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400"
          >
            Check out
          </Link>

          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            Payment is cash on delivery.
          </p>
        </div>
      </aside>
    </div>
  );
}
