'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveAddress } from '@/hooks/use-account';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';
import type { Address } from '@/types/api';
import { cn } from '@/lib/utils';

/**
 * Presets for the address type.
 *
 * Stored in `Address.label`, which is free text the schema already provides for
 * exactly this. Presets cover the common cases; the field stays typable so
 * "Mum's house" or "Shop" works without a migration every time someone has a
 * kind of address we did not think of.
 */
const LABEL_PRESETS = ['Home', 'Work', 'Other'] as const;

export function AddressForm({
  address,
  onDone,
  onCancel,
}: {
  address?: Address;
  onDone: () => void;
  onCancel: () => void;
}) {
  const customer = useAuthStore((state) => state.customer);
  const save = useSaveAddress();

  const [form, setForm] = useState({
    label: address?.label ?? 'Home',
    // Prefilled from the account for a first address, because retyping your own
    // name and number on every form is the kind of friction that loses orders.
    fullName: address?.fullName ?? customer?.name ?? '',
    phone: address?.phone ?? customer?.phone ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postalCode ?? '',
    country: address?.country ?? 'India',
    isDefault: address?.isDefault ?? false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { ...(address ? { id: address.id } : {}), ...form, line2: form.line2 || undefined },
          {
            onSuccess: () => {
              toast.success(address ? 'Address updated' : 'Address added');
              onDone();
            },
            onError: (error) =>
              toast.error(getErrorMessage(error, 'Could not save this address.')),
          },
        );
      }}
      className="space-y-4 rounded-lg border border-paper-300 bg-paper-50 p-5"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-800">Type</legend>
        <div className="flex flex-wrap gap-2">
          {LABEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => set('label', preset)}
              className={cn(
                'rounded-md border px-3.5 py-1.5 text-sm transition-colors',
                form.label === preset
                  ? 'border-ink-900 bg-ink-900 text-paper-50'
                  : 'border-ink-200 text-ink-600 hover:border-ink-300',
              )}
            >
              {preset}
            </button>
          ))}
          <input
            aria-label="Custom address type"
            value={form.label}
            onChange={(event) => set('label', event.target.value)}
            placeholder="Or type your own"
            className="min-w-36 flex-1 rounded-md border border-ink-200 bg-paper-100 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" value={form.fullName} onChange={(v) => set('fullName', v)} required autoComplete="name" />
        <Field label="Phone for this delivery" value={form.phone} onChange={(v) => set('phone', v)} required type="tel" autoComplete="tel" />
      </div>

      <Field label="Address line 1" value={form.line1} onChange={(v) => set('line1', v)} required autoComplete="address-line1" />
      <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => set('line2', v)} autoComplete="address-line2" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" value={form.city} onChange={(v) => set('city', v)} required autoComplete="address-level2" />
        <Field label="State" value={form.state} onChange={(v) => set('state', v)} required autoComplete="address-level1" />
        <Field label="PIN code" value={form.postalCode} onChange={(v) => set('postalCode', v)} required inputMode="numeric" autoComplete="postal-code" />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => set('isDefault', event.target.checked)}
          className="h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500"
        />
        Use this as my default delivery address
      </label>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {address ? 'Save changes' : 'Add address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-ink-300 px-5 py-2.5 text-sm text-ink-800 transition-colors hover:bg-paper-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: 'numeric' | 'tel' | 'text';
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-ink-200 bg-paper-100 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}
