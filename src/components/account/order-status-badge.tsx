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
  PACKED: 'bg-gold-100 text-gold-800',
  SHIPPED: 'bg-turmeric-100 text-turmeric-600',
  DELIVERED: 'bg-gold-500 text-ink-900',
  CANCELLED: 'bg-chilli-100 text-chilli-500',
  RETURNED: 'bg-chilli-100 text-chilli-500',
};

const LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'On its way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
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
