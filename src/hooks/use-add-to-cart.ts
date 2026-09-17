'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/customer-api';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore, type CartLine } from '@/store/cart-store';
import { accountKeys, useServerCart } from './use-account';

/**
 * Adds a product to whichever cart is authoritative.
 *
 * This exists because the two carts are not interchangeable and forgetting that
 * produced a real bug: `AddToCart` wrote to the guest store unconditionally
 * while `/cart` read the SERVER cart once signed in, so a signed-in customer
 * saw "added to your bag" and then an empty bag. The toast was telling the
 * truth about localStorage and lying about what the customer would see next.
 *
 * Every add now goes through here, so there is one place that knows which cart
 * is in play rather than each caller having to remember.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const addLocal = useCartStore((state) => state.add);

  const mutation = useMutation({
    mutationFn: async ({
      line,
      quantity,
    }: {
      line: Omit<CartLine, 'quantity'>;
      quantity: number;
    }) => {
      if (status === 'authenticated') {
        await customerApi.post('/customer/cart', {
          productId: line.productId,
          ...(line.variantId ? { variantId: line.variantId } : {}),
          quantity,
        });
        return;
      }

      // Signed out, or the session has not resolved yet. The guest cart is what
      // the visitor can see, and it merges into the server cart on sign-in.
      addLocal(line, quantity);
    },
    onSuccess: () => {
      // Only meaningful for the signed-in path; harmless otherwise.
      void queryClient.invalidateQueries({ queryKey: accountKeys.cart });
    },
  });

  return mutation;
}

/**
 * How many of this product are already in the authoritative cart.
 *
 * Used to cap what can still be added against stock, and to tell the customer
 * what they already hold. Reading only the guest store would understate it for
 * a signed-in customer and let them exceed stock.
 *
 * Subscribes via `useServerCart` rather than reading the query cache directly -
 * a one-off `getQueryData` does not re-render when the cart changes, so the
 * count would freeze at whatever it was on first paint.
 */
export function useQuantityInCart(productId: string, variantId: string | null = null): number {
  const status = useAuthStore((state) => state.status);
  const guestQuantity = useCartStore(
    (state) =>
      state.lines.find(
        (line) => line.productId === productId && line.variantId === variantId,
      )?.quantity ?? 0,
  );
  const serverCart = useServerCart();

  if (status === 'authenticated') {
    return (
      serverCart.data?.items.find(
        (item) => item.productId === productId && (item.variantId ?? null) === variantId,
      )?.quantity ?? 0
    );
  }

  return guestQuantity;
}
