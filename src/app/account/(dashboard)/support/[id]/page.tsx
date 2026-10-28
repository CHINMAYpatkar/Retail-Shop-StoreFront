'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useReplyToTicket, useSupportTicket } from '@/hooks/use-account';
import { TicketStatusBadge } from '@/components/account/ticket-status-badge';
import { EmptyState } from '@/components/shop/empty-state';
import { formatOrderDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

export default function SupportThreadPage() {
  const params = useParams<{ id: string }>();
  const { data: ticket, isLoading, isError } = useSupportTicket(params.id);
  const reply = useReplyToTicket(params.id);
  const [message, setMessage] = useState('');

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-paper-200" aria-busy="true" />;
  }

  if (isError || !ticket) {
    return (
      <EmptyState
        title="Message not found"
        description="This conversation does not exist, or it belongs to another account."
        actionHref="/account/support"
        actionLabel="Back to support"
      />
    );
  }

  // Closed tickets are read-only. Letting someone write into a thread nobody is
  // watching is worse than telling them to start a new one.
  const closed = ticket.status === 'CLOSED';

  return (
    <div>
      <Link
        href="/account/support"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All messages
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-ink-900">{ticket.subject}</h1>
          <p className="mt-1 font-data text-xs text-ink-400">{ticket.ticketNumber}</p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <ol className="mt-8 space-y-4">
        {ticket.messages.map((entry) => {
          const fromShop = entry.senderType === 'admin';

          return (
            <li
              key={entry.id}
              className={cn(
                'rounded-lg border p-4',
                fromShop
                  ? 'border-gold-200 bg-gold-50'
                  : 'border-paper-300 bg-paper-50',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink-900">
                  {fromShop ? (entry.senderName ?? 'The shop') : 'You'}
                </span>
                <time dateTime={entry.createdAt} className="font-data text-xs text-ink-400">
                  {formatOrderDateTime(entry.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">
                {entry.message}
              </p>
            </li>
          );
        })}
      </ol>

      {closed ? (
        <p className="mt-8 border-t border-paper-300 pt-6 text-sm text-ink-500">
          This conversation is closed.{' '}
          <Link href="/contact" className="text-gold-700 underline underline-offset-2">
            Start a new one
          </Link>{' '}
          if you need us again.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = message.trim();
            if (!trimmed) return;

            reply.mutate(trimmed, {
              onSuccess: () => setMessage(''),
              onError: (error) =>
                toast.error(getErrorMessage(error, 'Could not send your reply.')),
            });
          }}
          className="mt-8 border-t border-paper-300 pt-6"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Reply</span>
            <textarea
              rows={4}
              maxLength={4000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add anything else that would help us."
              className="w-full resize-y rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!message.trim() || reply.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
          >
            {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send reply
          </button>
        </form>
      )}
    </div>
  );
}
