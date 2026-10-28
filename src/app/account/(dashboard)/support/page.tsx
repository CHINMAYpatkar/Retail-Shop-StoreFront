'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSupportTickets } from '@/hooks/use-account';
import { TicketStatusBadge } from '@/components/account/ticket-status-badge';
import { EmptyState } from '@/components/shop/empty-state';
import { formatOrderDate } from '@/lib/format';

export default function SupportPage() {
  const { data: tickets, isLoading } = useSupportTickets();

  return (
    <div>
      <h1 className="font-display text-display-sm text-ink-900">Support</h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Messages you have sent us, and our replies.
      </p>

      <div className="mt-8">
        {isLoading ? (
          <ul className="space-y-3" aria-busy="true">
            {[0, 1].map((row) => (
              <li key={row} className="h-20 animate-pulse rounded-lg bg-paper-200" />
            ))}
          </ul>
        ) : !tickets || tickets.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Anything you send us from the contact page will appear here."
            actionHref="/contact"
            actionLabel="Contact us"
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/account/support/${ticket.id}`}
                  className="group flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-paper-300 bg-paper-50 p-4 transition-colors hover:border-ink-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink-900">{ticket.subject}</p>
                    <p className="mt-1 font-data text-xs text-ink-400">
                      {ticket.ticketNumber} · {formatOrderDate(ticket.createdAt)}
                    </p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
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
