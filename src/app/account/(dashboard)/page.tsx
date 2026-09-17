'use client';

import Link from 'next/link';
import { ArrowRight, Heart, MapPin, Package } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAddresses, useOrders, useWishlist } from '@/hooks/use-account';

/**
 * Account overview.
 *
 * A client component because everything on it is per-customer and behind
 * authentication - there is nothing here worth server-rendering or caching.
 */
export default function AccountPage() {
  const customer = useAuthStore((state) => state.customer);
  const orders = useOrders();
  const addresses = useAddresses();
  const wishlist = useWishlist();

  return (
    <div>
      <h1 className="font-display text-display-sm text-ink-900">
        {customer?.name ? `Hello, ${customer.name.split(' ')[0]}` : 'Your account'}
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">{customer?.email}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          href="/account/orders"
          label="Orders"
          value={orders.data?.length}
          loading={orders.isLoading}
          Icon={Package}
        />
        <SummaryCard
          href="/account/addresses"
          label="Addresses"
          value={addresses.data?.length}
          loading={addresses.isLoading}
          Icon={MapPin}
        />
        <SummaryCard
          href="/account/wishlist"
          label="Wishlist"
          value={wishlist.data?.length}
          loading={wishlist.isLoading}
          Icon={Heart}
        />
      </dl>

      <section className="mt-10 rounded-lg border border-paper-300 bg-paper-50 p-5">
        <h2 className="font-display text-lg text-ink-900">Your details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Name" value={customer?.name} />
          <Row label="Email" value={customer?.email} />
          <Row label="Contact number" value={customer?.phone} />
        </dl>
        <Link
          href="/account/complete"
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-gold-700 transition-colors hover:text-gold-800"
        >
          Edit details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

function SummaryCard({
  href,
  label,
  value,
  loading,
  Icon,
}: {
  href: string;
  label: string;
  value: number | undefined;
  loading: boolean;
  Icon: typeof Package;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-paper-300 bg-paper-50 p-4 transition-colors hover:border-ink-300"
    >
      <div className="flex items-center justify-between">
        <dt className="text-sm text-ink-500">{label}</dt>
        <Icon className="h-4 w-4 text-ink-300 transition-colors group-hover:text-gold-600" />
      </div>
      <dd className="mt-2 font-data text-2xl text-ink-900" data-numeric>
        {loading ? <span className="text-ink-200">—</span> : (value ?? 0)}
      </dd>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-4">
      <dt className="w-36 shrink-0 text-ink-400">{label}</dt>
      <dd className="text-ink-800">{value || <span className="text-ink-300">Not set</span>}</dd>
    </div>
  );
}
