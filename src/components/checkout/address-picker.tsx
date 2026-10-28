'use client';

import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useAddresses } from '@/hooks/use-account';
import { AddressForm } from '@/components/account/address-form';
import { cn } from '@/lib/utils';
import type { Address } from '@/types/api';

/**
 * Picks the delivery address, and lets one be added without leaving checkout.
 *
 * Sending someone to the address book mid-checkout and hoping they come back is
 * how carts get abandoned - a first-time customer has no saved address by
 * definition, so the add form has to be here.
 */
export function AddressPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: addresses, isLoading } = useAddresses();
  const [adding, setAdding] = useState(false);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg bg-paper-200" aria-busy="true" />;
  }

  const list = addresses ?? [];

  return (
    <div className="space-y-4">
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((address) => (
            <li key={address.id}>
              <AddressOption
                address={address}
                checked={selectedId === address.id}
                onSelect={() => onSelect(address.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <AddressForm
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 px-4 py-2.5 text-sm text-ink-700 transition-colors hover:border-ink-800 hover:bg-paper-200"
        >
          <Plus className="h-3.5 w-3.5" />
          {list.length === 0 ? 'Add a delivery address' : 'Use a different address'}
        </button>
      )}
    </div>
  );
}

function AddressOption({
  address,
  checked,
  onSelect,
}: {
  address: Address;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    // A real radio inside a label: the whole card is clickable, arrow keys move
    // between options, and a screen reader announces it as a grouped choice.
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
        checked ? 'border-ink-900 bg-paper-50' : 'border-paper-300 hover:border-ink-300',
      )}
    >
      <input
        type="radio"
        name="delivery-address"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 border-ink-300 text-gold-600 focus:ring-gold-500"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {address.label ? (
            <span className="rounded bg-paper-300 px-2 py-0.5 text-xs font-medium text-ink-700">
              {address.label}
            </span>
          ) : null}
          {address.isDefault ? (
            <span className="inline-flex items-center gap-1 text-xs text-gold-700">
              <Star className="h-3 w-3 fill-gold-600 text-gold-600" />
              Default
            </span>
          ) : null}
        </div>

        <address className="mt-2 text-sm not-italic leading-relaxed text-ink-700">
          <span className="text-ink-900">{address.fullName}</span>
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          <span className="font-data text-ink-500">{address.phone}</span>
        </address>
      </div>
    </label>
  );
}
