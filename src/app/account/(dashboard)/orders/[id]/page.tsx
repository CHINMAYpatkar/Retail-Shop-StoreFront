'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCancelOrder, useOrder } from '@/hooks/use-account';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { EmptyState } from '@/components/shop/empty-state';
import { formatPrice } from '@/lib/utils';
import { formatOrderDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';

/** Statuses a customer may still cancel from - mirrors the backend's list. */
const CANCELLABLE = ['PLACED', 'CONFIRMED'];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrder(params.id);
  const cancel = useCancelOrder();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-paper-200" aria-busy="true" />;
  }

  if (isError || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order does not exist, or it belongs to another account."
        actionHref="/account/orders"
        actionLabel="Back to orders"
      />
    );
  }

  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-400">{formatOrderDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === 'CANCELLED' && order.cancelReason ? (
        <p className="mt-4 rounded-md border-l-2 border-chilli-300 bg-chilli-50 px-4 py-3 text-sm text-chilli-600">
          {order.cancelReason}
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-paper-300 border-y border-paper-300">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0">
              {/* The snapshot name, not the live product name. If the shop
                  renames a blend, the order must still say what was bought. */}
              <p className="text-ink-900">{item.productName}</p>
              <p className="mt-1 font-data text-xs text-ink-400" data-numeric>
                {formatPrice(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <span className="shrink-0 font-data text-sm text-ink-900" data-numeric>
              {formatPrice(item.totalPrice)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 text-sm">
        <Line label="Subtotal" value={order.subtotal} />
        {Number(order.discountAmount) > 0 ? (
          <Line label="Discount" value={`-${order.discountAmount}`} />
        ) : null}
        <Line label="Delivery" value={order.shippingAmount} />
        <div className="flex justify-between border-t border-paper-300 pt-3">
          <dt className="font-medium text-ink-900">Total</dt>
          <dd className="font-data font-medium text-ink-900" data-numeric>
            {formatPrice(order.totalAmount)}
          </dd>
        </div>
      </dl>

      {order.address ? (
        <section className="mt-8 rounded-lg border border-paper-300 bg-paper-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
            Delivering to
          </h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-ink-700">
            <p className="text-ink-900">{order.address.fullName}</p>
            <p>{order.address.line1}</p>
            {order.address.line2 ? <p>{order.address.line2}</p> : null}
            <p>
              {order.address.city}, {order.address.state} {order.address.postalCode}
            </p>
            <p className="mt-1 font-data">{order.address.phone}</p>
          </address>
        </section>
      ) : null}

      {canCancel ? (
        <div className="mt-8 border-t border-paper-300 pt-6">
          {confirming ? (
            <div className="rounded-lg border border-chilli-200 bg-chilli-50 p-4">
              <p className="text-sm text-ink-800">
                Cancel this order? We cannot undo it, but you can always place another.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() =>
                    cancel.mutate(
                      { id: order.id },
                      {
                        onSuccess: () => {
                          toast.success('Order cancelled');
                          setConfirming(false);
                        },
                        onError: (error) =>
                          toast.error(getErrorMessage(error, 'Could not cancel this order.')),
                      },
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-md bg-chilli-400 px-5 py-2.5 text-sm font-medium text-paper-50 transition-colors hover:bg-chilli-500 disabled:opacity-60"
                >
                  {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Yes, cancel it
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-ink-300 px-5 py-2.5 text-sm text-ink-800 transition-colors hover:bg-paper-200"
                >
                  Keep the order
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-sm text-ink-500 underline underline-offset-2 transition-colors hover:text-chilli-400"
            >
              Cancel this order
            </button>
          )}
        </div>
      ) : (
        <p className="mt-8 border-t border-paper-300 pt-6 text-sm text-ink-400">
          This order can no longer be cancelled here.{' '}
          <Link href="/contact" className="text-gold-700 underline underline-offset-2">
            Get in touch
          </Link>{' '}
          if something is wrong.
        </p>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-data text-ink-800" data-numeric>
        {formatPrice(value)}
      </dd>
    </div>
  );
}
