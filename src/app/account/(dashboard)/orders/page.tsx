'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useOrders } from '@/hooks/use-account';
import { EmptyState } from '@/components/shop/empty-state';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { formatPrice } from '@/lib/utils';
import { formatOrderDate } from '@/lib/format';

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders();

  return (
    <div>
      <h1 className="font-display text-display-sm text-ink-900">Orders</h1>

      <div className="mt-8">
        {isLoading ? (
          <ul className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <li key={row} className="h-24 animate-pulse rounded-lg bg-paper-200" />
            ))}
          </ul>
        ) : isError ? (
          <EmptyState
            title="Could not load your orders"
            description="Something went wrong reaching the shop. Please try again shortly."
            actionHref="/account"
            actionLabel="Back to account"
          />
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place an order it will appear here, with its progress."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-paper-300 bg-paper-50 p-4 transition-colors hover:border-ink-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-data text-sm text-ink-900">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {formatOrderDate(order.createdAt)} ·{' '}
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <OrderStatusBadge status={order.status} />

                  <span className="font-data text-sm text-ink-900" data-numeric>
                    {formatPrice(order.totalAmount)}
                  </span>

                  <ArrowRight className="h-4 w-4 text-ink-300 transition-transform duration-300 ease-spice group-hover:translate-x-1 group-hover:text-gold-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
