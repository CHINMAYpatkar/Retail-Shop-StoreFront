// @vitest-environment jsdom
/**
 * Backorder status, as the customer sees it.
 *
 * Two new order statuses and a whole new per-line status arrived with partial
 * fulfilment. F20 was exactly this situation handled badly - a status the
 * union did not know about, rendered to a customer as a raw database enum.
 * The `Record<Status, …>` typing makes a missing entry a compile error now;
 * these cover what the compiler cannot see, which is whether the words are
 * fit to show somebody waiting on their spices.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OrderItemStatus, OrderStatus } from '@/types/api';
import { CUSTOMER_CANCELLABLE_STATUSES } from '@/types/api';
import { OrderItemStatusBadge, OrderStatusBadge } from './order-status-badge';

const NEW_ORDER_STATUSES: OrderStatus[] = ['AWAITING_STOCK', 'PARTIALLY_SHIPPED'];
const ITEM_STATUSES: OrderItemStatus[] = ['PENDING', 'AWAITING_STOCK', 'SHIPPED', 'DELIVERED'];

describe('the two new order statuses', () => {
  it.each(NEW_ORDER_STATUSES)('never shows the raw enum for %s', (status) => {
    const { container } = render(<OrderStatusBadge status={status} />);
    expect(container.textContent?.trim()).not.toBe(status);
    expect(container.textContent?.trim()).toBeTruthy();
  });

  it('does not tell the customer their order is "out of stock"', () => {
    // That reads as "something has gone wrong with my order". It has not -
    // the order is intact and waiting, and the date on the item says for how
    // long.
    render(<OrderStatusBadge status="AWAITING_STOCK" />);
    const text = screen.getByText(/waiting/i).textContent ?? '';
    expect(text.toLowerCase()).not.toContain('out of stock');
    expect(text.toLowerCase()).not.toContain('unavailable');
  });

  it('distinguishes a part-shipped order from a fully shipped one', () => {
    // If these read the same, a customer who has received one of two parcels
    // has no way to tell whether the second is coming.
    const partial = render(<OrderStatusBadge status="PARTIALLY_SHIPPED" />);
    const full = render(<OrderStatusBadge status="SHIPPED" />);
    expect(partial.container.textContent).not.toBe(full.container.textContent);
  });
});

describe('a line’s own status', () => {
  it('renders nothing at all for an ordinary line', () => {
    // A badge on every line of every normal order is noise, and noise is what
    // stops people reading the one badge that matters.
    const { container } = render(<OrderItemStatusBadge status="PENDING" />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(ITEM_STATUSES.filter((s) => s !== 'PENDING'))(
    'shows readable wording for %s',
    (status) => {
      const { container } = render(<OrderItemStatusBadge status={status} />);
      expect(container.textContent?.trim()).toBeTruthy();
      expect(container.textContent?.trim()).not.toBe(status);
    },
  );

  it('gives each visible status a distinct label', () => {
    const labels = new Set(
      ITEM_STATUSES.filter((s) => s !== 'PENDING').map(
        (status) => render(<OrderItemStatusBadge status={status} />).container.textContent,
      ),
    );
    expect(labels.size).toBe(3);
  });

  it('says a held line is coming, not that it is missing', () => {
    render(<OrderItemStatusBadge status="AWAITING_STOCK" />);
    expect(screen.getByText(/coming/i)).toBeInTheDocument();
  });
});

describe('cancelling a backordered order', () => {
  it('is still offered while the order waits on stock', () => {
    // This is the order a customer is MOST likely to want to cancel - they
    // have just been told part of it is weeks away. The backend allows it, so
    // leaving it out of this list would hide the one action they came for.
    expect(CUSTOMER_CANCELLABLE_STATUSES).toContain('AWAITING_STOCK');
  });

  it('is not offered once a parcel is out', () => {
    // Goods are with a courier; that is a return, not a cancellation.
    expect(CUSTOMER_CANCELLABLE_STATUSES).not.toContain('PARTIALLY_SHIPPED');
    expect(CUSTOMER_CANCELLABLE_STATUSES).not.toContain('SHIPPED');
  });
});
