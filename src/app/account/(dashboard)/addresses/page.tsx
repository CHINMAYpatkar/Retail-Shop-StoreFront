'use client';

import { useState } from 'react';
import { Plus, Star, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAddresses, useDeleteAddress } from '@/hooks/use-account';
import { AddressForm } from '@/components/account/address-form';
import { EmptyState } from '@/components/shop/empty-state';
import { getErrorMessage } from '@/lib/errors';
import type { Address } from '@/types/api';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const remove = useDeleteAddress();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-display-sm text-ink-900">Addresses</h1>
        {!adding && !editing ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-300 px-4 py-2 text-sm text-ink-800 transition-colors hover:border-ink-800 hover:bg-ink-900 hover:text-paper-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add address
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
        Add as many as you need — home, work, a relative&apos;s. You pick one at checkout.
      </p>

      <div className="mt-8 space-y-4">
        {adding ? (
          <AddressForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
        ) : null}

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1].map((row) => (
              <div key={row} className="h-32 animate-pulse rounded-lg bg-paper-200" />
            ))}
          </div>
        ) : !addresses || addresses.length === 0 ? (
          adding ? null : (
            <EmptyState
              title="No addresses saved"
              description="Add one now, or leave it until checkout — whichever suits."
              actionHref="/shop"
              actionLabel="Browse the shelf"
            />
          )
        ) : (
          <ul className="space-y-4">
            {addresses.map((address) =>
              editing?.id === address.id ? (
                <li key={address.id}>
                  <AddressForm
                    address={address}
                    onDone={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li
                  key={address.id}
                  className="rounded-lg border border-paper-300 bg-paper-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {address.label ? (
                        <span className="rounded bg-paper-300 px-2 py-0.5 text-xs font-medium text-ink-700">
                          {address.label}
                        </span>
                      ) : null}
                      {address.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-800">
                          <Star className="h-3 w-3 fill-gold-600 text-gold-600" />
                          Default
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(address)}
                        aria-label={`Edit ${address.label ?? 'address'}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${address.label ?? 'address'}`}
                        onClick={() => {
                          // No confirm dialog: an address is cheap to retype,
                          // and past orders keep their own snapshot, so this
                          // cannot damage order history.
                          remove.mutate(address.id, {
                            onSuccess: () => toast.success('Address removed'),
                            onError: (error) =>
                              toast.error(
                                getErrorMessage(error, 'Could not remove this address.'),
                              ),
                          });
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-ink-500 transition-colors hover:bg-paper-200 hover:text-chilli-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <address className="mt-3 text-sm not-italic leading-relaxed text-ink-700">
                    <p className="text-ink-900">{address.fullName}</p>
                    <p>{address.line1}</p>
                    {address.line2 ? <p>{address.line2}</p> : null}
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="mt-1 font-data text-ink-500">{address.phone}</p>
                  </address>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
