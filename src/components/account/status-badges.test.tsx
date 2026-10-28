// @vitest-environment jsdom
/**
 * Order and ticket status badges.
 *
 * F20 was exactly this: the union had seven of the ten order statuses, so a
 * PACKED order fell through to the fallback and showed a customer the raw
 * enum. The `Record<Status, ...>` maps make a missing status a compile error
 * now - these tests cover what the compiler cannot see, namely that each
 * label is written for a customer rather than copied from the database.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OrderStatus, TicketStatus } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { TicketStatusBadge } from './ticket-status-badge';

/**
 * Every value of the backend's `OrderStatus`, written out.
 *
 * Deliberately a literal rather than something derived from the component, so
 * dropping a status from the union cannot also drop it from the test.
 */
const ORDER_STATUSES: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
];

const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

describe('order status badge', () => {
  it.each(ORDER_STATUSES)('never shows the raw enum for %s', (status) => {
    const { container } = render(<OrderStatusBadge status={status} />);
    expect(container.textContent?.trim()).not.toBe(status);
    expect(container.textContent?.trim()).toBeTruthy();
  });

  it.each(ORDER_STATUSES)('carries a background tone for %s', (status) => {
    // Not a fallback check - PLACED's own style is the same neutral the
    // fallback uses, so the class string cannot tell those two apart. This
    // only asserts every status is styled rather than rendering bare.
    const { container } = render(<OrderStatusBadge status={status} />);
    expect(container.firstElementChild?.className).toContain('bg-');
  });

  it('uses the shop\u2019s wording, not the database\u2019s', () => {
    render(<OrderStatusBadge status="PROCESSING" />);
    expect(screen.getByText('Being ground')).toBeInTheDocument();
  });

  it('reads as plain words for a status with an underscore', () => {
    // OUT_FOR_DELIVERY is the one a naive `toLowerCase()` would mangle.
    render(<OrderStatusBadge status="OUT_FOR_DELIVERY" />);
    expect(screen.getByText('Out for delivery')).toBeInTheDocument();
  });

  it('carries the meaning in text, not colour alone', () => {
    // A colour-blind customer and a screen reader both get only the label.
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('distinguishes the three end states a customer must tell apart', () => {
    const labels = new Set(
      (['CANCELLED', 'RETURNED', 'REFUNDED'] as OrderStatus[]).map((status) => {
        const { container } = render(<OrderStatusBadge status={status} />);
        return container.textContent?.trim();
      }),
    );
    expect(labels.size).toBe(3);
  });
});

describe('ticket status badge', () => {
  it.each(TICKET_STATUSES)('never shows the raw enum for %s', (status) => {
    const { container } = render(<TicketStatusBadge status={status} />);
    expect(container.textContent?.trim()).not.toBe(status);
    expect(container.textContent?.trim()).toBeTruthy();
  });

  it('reassures rather than reporting state for IN_PROGRESS', () => {
    render(<TicketStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('We are on it')).toBeInTheDocument();
  });

  it('gives every status a distinct label', () => {
    const labels = new Set(
      TICKET_STATUSES.map((status) => {
        const { container } = render(<TicketStatusBadge status={status} />);
        return container.textContent?.trim();
      }),
    );
    expect(labels.size).toBe(TICKET_STATUSES.length);
  });
});
