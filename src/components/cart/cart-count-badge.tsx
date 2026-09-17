'use client';

import { useCartStore, cartCount } from '@/store/cart-store';

/**
 * The item count on the header bag icon.
 *
 * Renders nothing until the store has rehydrated from `localStorage`. The
 * server cannot know what is in a visitor's cart, so rendering a count during
 * SSR would either be wrong or cause a hydration mismatch - and a badge that
 * flashes "0" before showing "3" looks broken.
 */
export function CartCountBadge() {
  const hydrated = useCartStore((state) => state.hydrated);
  const count = useCartStore((state) => cartCount(state.lines));

  if (!hydrated || count === 0) return null;

  return (
    <span
      // Announced as part of the link's accessible name via aria-label on the
      // parent, so this is decorative here and must not be read twice.
      aria-hidden
      className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-chilli-400 px-1 font-data text-[10px] font-semibold leading-none text-paper-50"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** The same count, as text, for the link's accessible name. */
export function useCartCountLabel(): string {
  const hydrated = useCartStore((state) => state.hydrated);
  const count = useCartStore((state) => cartCount(state.lines));

  if (!hydrated || count === 0) return 'Cart, empty';
  return `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
}
