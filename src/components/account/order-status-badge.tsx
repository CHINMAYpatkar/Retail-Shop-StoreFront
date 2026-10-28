import { cn } from '@/lib/utils';
import type { OrderItemStatus, OrderStatus } from '@/types/api';

/**
 * Order status, with colour carrying meaning but never carrying it alone -
 * the label is always present, so the badge works for a colour-blind customer
 * and in a screen reader.
 */
const STYLES: Record<OrderStatus, string> = {
  PLACED: 'bg-paper-300 text-ink-700',
  CONFIRMED: 'bg-gold-100 text-gold-800',
  PROCESSING: 'bg-gold-100 text-gold-800',
  AWAITING_STOCK: 'bg-turmeric-100 text-turmeric-600',
  PACKED: 'bg-gold-100 text-gold-800',
  SHIPPED: 'bg-turmeric-100 text-turmeric-600',
  PARTIALLY_SHIPPED: 'bg-turmeric-100 text-turmeric-600',
  OUT_FOR_DELIVERY: 'bg-turmeric-200 text-turmeric-600',
  DELIVERED: 'bg-gold-500 text-ink-900',
  CANCELLED: 'bg-chilli-100 text-chilli-500',
  RETURNED: 'bg-chilli-100 text-chilli-500',
  REFUNDED: 'bg-chilli-100 text-chilli-500',
};

/**
 * Customer-facing wording, not the raw enum.
 *
 * "On its way" reads better than "SHIPPED" to someone waiting for spices, and
 * "Being ground" says what PROCESSING actually means at this shop.
 */
const LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Being ground',
  // Not "out of stock", which sounds like the order is in trouble. It is
  // not - it is waiting, and the date on the item itself says for how long.
  AWAITING_STOCK: 'Waiting on a batch',
  PACKED: 'Packed',
  SHIPPED: 'On its way',
  PARTIALLY_SHIPPED: 'Part on its way',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded px-2.5 py-1 text-xs font-medium',
        STYLES[status] ?? 'bg-paper-300 text-ink-700',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}


/**
 * One line's own status.
 *
 * Returns nothing for PENDING. A badge on every line of every ordinary order
 * would be noise, and noise is what stops people reading the one badge that
 * matters.
 */
const ITEM_STYLES: Record<OrderItemStatus, string | null> = {
  PENDING: null,
  AWAITING_STOCK: 'bg-turmeric-100 text-turmeric-600',
  SHIPPED: 'bg-gold-100 text-gold-800',
  DELIVERED: 'bg-gold-500 text-ink-900',
};

const ITEM_LABELS: Record<OrderItemStatus, string> = {
  PENDING: '',
  AWAITING_STOCK: 'Coming later',
  SHIPPED: 'On its way',
  DELIVERED: 'Delivered',
};

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const style = ITEM_STYLES[status];
  if (!style) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-medium',
        style,
      )}
    >
      {ITEM_LABELS[status]}
    </span>
  );
}
