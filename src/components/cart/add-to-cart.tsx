'use client';

import { Check, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAddToCart, useQuantityInCart } from '@/hooks/use-add-to-cart';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';
import { QuantityStepper } from './quantity-stepper';
import { WishlistButton } from '@/components/product/wishlist-button';

interface AddToCartProps {
  productId: string;
  slug: string;
  name: string;
  price: string;
  imageUrl: string | null;
  stockQuantity: number;
}

/**
 * Adds a product to the guest cart.
 *
 * The cart lives in `localStorage`, so this cannot render its real state during
 * server rendering. Rather than guess and cause a hydration mismatch, the
 * control renders its default state on the server and only reflects what is
 * already in the cart once the store reports it has rehydrated.
 *
 * Stock is checked against what the page was rendered with, which may be stale
 * by the time someone clicks. That is fine here: this is a courtesy check, and
 * the real decision is made server-side at checkout where stock is read inside
 * the same transaction that decrements it.
 */
export function AddToCart({
  productId,
  slug,
  name,
  price,
  imageUrl,
  stockQuantity,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const addToCart = useAddToCart();
  const status = useAuthStore((state) => state.status);
  const alreadyHeld = useQuantityInCart(productId, null);

  // Both carts settle asynchronously - the guest one reads localStorage, the
  // server one is a fetch - so the held count is only trustworthy once the
  // session is resolved.
  const resolved = status !== 'unknown';

  const outOfStock = stockQuantity <= 0;
  // Never offer more than exists. If the customer already holds some, the
  // remainder is what is still addable.
  const maxAddable = Math.max(stockQuantity - alreadyHeld, 0);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  if (outOfStock) {
    return (
      <div className="mt-7 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-disabled
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-paper-300 px-6 py-3.5 text-sm font-medium text-ink-400 sm:flex-none sm:px-10"
          >
            Out of stock
          </div>
          {/* Saving for later matters most here - this is the customer who
              cannot buy it today and would otherwise have nothing to do. */}
          <WishlistButton productId={productId} productName={name} />
        </div>
        <p className="text-sm leading-relaxed text-ink-500">
          We grind to order rather than holding inventory, so this goes out of stock until the next
          batch.{' '}
          <Link href="/contact" className="text-gold-700 underline underline-offset-2">
            Ask us when it is back
          </Link>
          .
        </p>
      </div>
    );
  }

  const nothingLeftToAdd = resolved && maxAddable <= 0;

  return (
    <div className="mt-7 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.max(maxAddable, 1)}
        />

        <button
          type="button"
          disabled={nothingLeftToAdd || addToCart.isPending}
          onClick={() =>
            addToCart.mutate(
              {
                line: { productId, variantId: null, slug, name, price, imageUrl },
                quantity,
              },
              {
                // The toast only fires on success now. It previously fired
                // unconditionally, which is how it came to promise an item was
                // in a bag that turned out to be empty.
                onSuccess: () => {
                  setJustAdded(true);
                  setQuantity(1);
                  toast.success(`${name} added to your bag`, {
                    action: {
                      label: 'View bag',
                      onClick: () => window.location.assign('/cart'),
                    },
                  });
                },
                onError: (error) =>
                  toast.error(getErrorMessage(error, 'Could not add that to your bag.')),
              },
            )
          }
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400 sm:flex-none sm:px-10"
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Add to bag
            </>
          )}
        </button>

        <WishlistButton productId={productId} productName={name} />
      </div>

      {/* Only once the session is resolved - during SSR we do not know which
          cart applies, let alone what is in it, and a guess would flicker. */}
      {resolved && alreadyHeld > 0 ? (
        <p className="text-sm text-ink-500" data-numeric>
          {alreadyHeld} already in your bag.{' '}
          <Link href="/cart" className="text-gold-700 underline underline-offset-2">
            View bag
          </Link>
          {nothingLeftToAdd ? ' — that is all we have in stock.' : ''}
        </p>
      ) : null}
    </div>
  );
}
