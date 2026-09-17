'use client';

import { useCartStore, cartCount } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useServerCart } from '@/hooks/use-account';

/**
 * How many items are in the bag, from whichever cart is authoritative.
 *
 * Signed in, that is the server cart; signed out, the guest cart in
 * `localStorage`. Reading only the guest store would show a stale or empty
 * count to a signed-in customer whose basket lives on their account.
 */
function useCartCount(): { count: number; ready: boolean } {
  const status = useAuthStore((state) => state.status);
  const guestHydrated = useCartStore((state) => state.hydrated);
  const guestCount = useCartStore((state) => cartCount(state.lines));
  const serverCart = useServerCart();

  if (status === 'authenticated') {
    return { count: serverCart.data?.itemCount ?? 0, ready: !serverCart.isLoading };
  }

  // While the session is still unknown, trust the guest cart: it is what the
  // visitor can see, and the count corrects itself a moment later if they turn
  // out to be signed in.
  return { count: guestCount, ready: guestHydrated };
}

export function CartCountBadge() {
  const { count, ready } = useCartCount();

  if (!ready || count === 0) return null;

  return (
    <span
      // Announced through the parent link's aria-label, so this is decorative
      // here and must not be read twice.
      aria-hidden
      className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-chilli-400 px-1 font-data text-[10px] font-semibold leading-none text-paper-50"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** The same count, as text, for the link's accessible name. */
export function useCartCountLabel(): string {
  const { count, ready } = useCartCount();

  if (!ready || count === 0) return 'Cart, empty';
  return `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
}
