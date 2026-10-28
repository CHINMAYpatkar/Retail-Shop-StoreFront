import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/api';

/**
 * Support ticket status.
 *
 * Exhaustive `Record`, so adding a status to the union is a compile error here
 * rather than a raw enum name shown to a customer - the mistake the order badge
 * made.
 */
const STYLES: Record<TicketStatus, string> = {
  OPEN: 'bg-gold-100 text-gold-800',
  IN_PROGRESS: 'bg-turmeric-100 text-turmeric-600',
  RESOLVED: 'bg-gold-500 text-ink-900',
  CLOSED: 'bg-paper-300 text-ink-600',
};

const LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'We are on it',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
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
