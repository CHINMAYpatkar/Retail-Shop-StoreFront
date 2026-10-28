import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/api';

/**
 * Order status, with colour carrying meaning but never carrying it alone -
 * the label is always present, so the badge works for a colour-blind customer
 * and in a screen reader.
 */
const STYLES: Record<OrderStatus, string> = {
  PLACED: 'bg-paper-300 text-ink-700',
  CONFIRMED: 'bg-gold-100 text-gold-800',
  PROCESSING: 'bg-gold-100 text-gold-800',
  PACKED: 'bg-gold-100 text-gold-800',
  SHIPPED: 'bg-turmeric-100 text-turmeric-600',
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
  PACKED: 'Packed',
  SHIPPED: 'On its way',
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
