'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { customerApi, unwrap } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';
import type { CustomerProfile } from '@/types/api';

/**
 * The registration step, shown after a first-time email is verified.
 *
 * The customer is **already signed in** by this point — the account exists and
 * the email is confirmed. This form only fills in the details, which is why
 * abandoning it is survivable: they keep a working account and get asked again
 * next time.
 *
 * The email is shown but not editable. It is the thing they just proved they
 * control, and letting it be changed here would hand back exactly the
 * unverified-address problem the OTP step exists to prevent.
 *
 * Address is not collected here. A customer can have several, with different
 * types, so they are managed on their own page and required at checkout —
 * where an address genuinely is required.
 */
export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const customer = useAuthStore((state) => state.customer);
  const setCustomer = useAuthStore((state) => state.setCustomer);

  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const updated = unwrap<CustomerProfile>(
        await customerApi.patch('/auth/customer/me', {
          name: name.trim(),
          phone: phone.trim(),
        }),
      );
      setCustomer(updated);
      toast.success('Welcome — your account is set up');
      router.push(next || '/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save your details. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim() && phone.trim()) void submit();
      }}
      className="space-y-5"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800">Email</label>
        <input
          type="email"
          value={customer?.email ?? ''}
          readOnly
          disabled
          // Verified a moment ago; changing it here would undo that.
          className="w-full cursor-not-allowed rounded-md border border-ink-200 bg-paper-200 px-3.5 py-3 text-ink-500"
        />
        <p className="mt-1.5 text-xs text-gold-700">Verified</p>
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-800">
          Your name
        </label>
        <input
          id="name"
          required
          autoFocus
          autoComplete="name"
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Chinmay Patkar"
          className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-3 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink-800">
          Contact number
        </label>
        <input
          id="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 98765 43210"
          className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-3 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Payment is cash on delivery, so this is the number we call about your order.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy || !name.trim() || !phone.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Saving…' : 'Finish'}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-400">
        You can add delivery addresses from your account at any time.
      </p>
    </form>
  );
}
