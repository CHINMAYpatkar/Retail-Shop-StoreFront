'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { customerApi, unwrap } from '@/lib/customer-api';
import { accountKeys, useAddresses, useServerCart } from '@/hooks/use-account';
import { AddressPicker } from './address-picker';
import { EmptyState } from '@/components/shop/empty-state';
import { Media } from '@/components/ui/media';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import type { CustomerOrder } from '@/types/api';

/**
 * Checkout.
 *
 * There is no payment step: the shop takes cash on delivery, so placing the
 * order is the last action. That makes this simpler than most checkouts, and it
 * means "Place order" is genuinely the point of no return - the copy says so
 * rather than implying a later confirmation screen.
 *
 * Everything shown comes from the SERVER cart. The guest cart is not usable
 * here: a customer must be signed in to check out, and by then their basket has
 * already been merged.
 */
export function CheckoutView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cart = useServerCart();
  const addresses = useAddresses();
  const [addressId, setAddressId] = useState<string | null>(null);

  // Preselect the default address, or the only one. Making someone choose from
  // a list of one is pure friction.
  useEffect(() => {
    if (addressId || !addresses.data?.length) return;
    const preferred = addresses.data.find((a) => a.isDefault) ?? addresses.data[0];
    setAddressId(preferred.id);
  }, [addresses.data, addressId]);

  const placeOrder = useMutation({
    mutationFn: async () =>
      unwrap<CustomerOrder>(
        await customerApi.post('/customer/orders', { addressId, paymentMethod: 'COD' }),
      ),
    onSuccess: (order) => {
      // The server empties the cart in the same transaction, so the cached copy
      // is stale the moment this returns.
      void queryClient.invalidateQueries({ queryKey: accountKeys.cart });
      void queryClient.invalidateQueries({ queryKey: accountKeys.orders });
      toast.success('Order placed');
      router.replace(`/account/orders/${order.id}?placed=1`);
    },
    onError: (error) => {
      // The server re-checks stock and availability inside the transaction, so
      // its messages are specific and worth showing verbatim: "Not enough stock
      // for X" tells the customer exactly what to change.
      toast.error(getErrorMessage(error, 'Could not place your order.'));
      // Whatever went wrong, our view of the cart may now be out of date.
      void queryClient.invalidateQueries({ queryKey: accountKeys.cart });
    },
  });

  if (cart.isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-paper-200" aria-busy="true" />;
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Add something to it and you can check out from there."
        actionHref="/shop"
        actionLabel="Browse the shelf"
      />
    );
  }

  const blocked = cart.data.items.some((item) => item.product.stockQuantity < item.quantity);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-10">
        <section>
          <h2 className="font-display text-xl text-ink-900">Deliver to</h2>
          <div className="mt-4">
            <AddressPicker selectedId={addressId} onSelect={setAddressId} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink-900">Your order</h2>
          <ul className="mt-4 divide-y divide-paper-300 border-y border-paper-300">
            {cart.data.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-paper-200">
                  <Media src={item.product.images?.[0]?.url} alt="" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-900">{item.product.name}</p>
                  <p className="mt-0.5 font-data text-xs text-ink-400" data-numeric>
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                  {item.product.stockQuantity < item.quantity ? (
                    <p className="mt-1 text-xs text-chilli-400">
                      Only {item.product.stockQuantity} left — reduce the quantity in your bag.
                    </p>
                  ) : null}
                </div>
                <span className="font-data text-sm text-ink-900" data-numeric>
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/cart"
            className="mt-3 inline-block text-sm text-gold-700 underline underline-offset-2"
          >
            Edit your bag
          </Link>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-paper-300 bg-paper-50 p-5">
          <h2 className="font-display text-lg text-ink-900">Summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">
                {cart.data.itemCount} {cart.data.itemCount === 1 ? 'item' : 'items'}
              </dt>
              <dd className="font-data text-ink-900" data-numeric>
                {formatPrice(cart.data.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery</dt>
              {/* Shipping is 0 server-side today. Saying "Free" is honest and
                  reassuring; it becomes a real figure when shipping rules land. */}
              <dd className="text-gold-700">Free</dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-paper-300 pt-4">
            <span className="font-medium text-ink-900">Total</span>
            <span className="font-data font-medium text-ink-900" data-numeric>
              {formatPrice(cart.data.subtotal)}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-md bg-paper-200 px-3.5 py-3 text-sm text-ink-600">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <p className="leading-relaxed">
              Pay in cash when the parcel arrives. Nothing is charged now.
            </p>
          </div>

          <button
            type="button"
            disabled={!addressId || blocked || placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
          >
            {placeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {placeOrder.isPending ? 'Placing…' : 'Place order'}
          </button>

          {/* Say WHY the button is disabled. A dead control with no explanation
              is the most frustrating thing on a checkout page. */}
          {!addressId ? (
            <p className="mt-3 text-xs text-ink-400">Choose a delivery address to continue.</p>
          ) : blocked ? (
            <p className="mt-3 text-xs text-chilli-400">
              Some items exceed what is in stock. Adjust your bag to continue.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
