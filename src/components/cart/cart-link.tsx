'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { CartCountBadge, useCartCountLabel } from './cart-count-badge';

/**
 * The header cart link.
 *
 * A client component only because the count is per-visitor and lives in
 * `localStorage`. Kept as small as possible so the rest of the header stays
 * server-rendered.
 */
export function CartLink() {
  const label = useCartCountLabel();

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      <CartCountBadge />
    </Link>
  );
}
