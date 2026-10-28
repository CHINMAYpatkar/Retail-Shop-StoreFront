'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { customerApi, unwrap } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';
import type { SupportTicket } from '@/types/api';

/**
 * The contact form.
 *
 * Works **signed out** — the backend exposes `POST support/tickets` publicly on
 * purpose, because a customer with a delivery problem should not have to
 * remember an account first. Signed in, it posts to the authenticated route
 * instead, which attaches the ticket to their account so the reply shows up
 * under Account → Support rather than only in their inbox.
 *
 * The `/contact` page has been telling customers to "use the support form"
 * since the demo content was written. Until now there was not one.
 */
export function ContactForm() {
  const customer = useAuthStore((state) => state.customer);
  const signedIn = useAuthStore((state) => state.status === 'authenticated');

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState<SupportTicket | null>(null);

  // Prefilled once known. Not held in state at first render, because the
  // session resolves after mount and a controlled input would otherwise keep
  // whatever empty value it started with.
  const name = form.name || customer?.name || '';
  const email = form.email || customer?.email || '';

  const submit = useMutation({
    mutationFn: async () =>
      unwrap<SupportTicket>(
        await customerApi.post(
          signedIn ? '/customer/support/tickets' : '/support/tickets',
          { name, email, subject: form.subject.trim(), message: form.message.trim() },
        ),
      ),
    onSuccess: (ticket) => setSent(ticket),
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Could not send your message. Please try again.')),
  });

  if (sent) {
    return (
      <div className="rounded-lg border border-gold-300 bg-gold-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" />
          <div>
            <h2 className="font-display text-lg text-ink-900">Message sent</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              Your reference is{' '}
              <span className="font-data text-ink-900">{sent.ticketNumber}</span>. We answer our
              own messages, so give us a working day.
              {signedIn ? ' You can follow it under Account → Support.' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Your name</span>
          <input
            required
            minLength={2}
            autoComplete="name"
            value={name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
            className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-800">Subject</span>
        <input
          required
          maxLength={200}
          value={form.subject}
          onChange={(event) => setForm((f) => ({ ...f, subject: event.target.value }))}
          placeholder="Order RS-… arrived damaged"
          className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-800">Message</span>
        <textarea
          required
          rows={6}
          maxLength={4000}
          value={form.message}
          onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
          placeholder="If it is about an order, include the order number — it is much faster than describing it."
          className="w-full resize-y rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={submit.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
      >
        {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submit.isPending ? 'Sending…' : 'Send message'}
      </button>

      {!signedIn ? (
        <p className="text-xs leading-relaxed text-ink-400">
          You do not need an account to message us. Signing in first means you can follow the
          reply on the site as well as by email.
        </p>
      ) : null}
    </form>
  );
}
