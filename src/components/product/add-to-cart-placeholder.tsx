import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

/**
 * Stands in for the real add-to-cart control.
 *
 * The cart lives behind customer authentication (`customer/cart`), and ADR 0009
 * calls for a guest cart merged on login - so a working button needs local cart
 * state, the OTP flow, and the merge. That is the next piece of work, not
 * something to half-build here.
 *
 * Rendered as a disabled control with an honest label rather than a button that
 * looks live and does nothing. A dead button is worse than an absent one: the
 * customer taps it, nothing happens, and they conclude the shop is broken.
 */
export function AddToCartPlaceholder({ outOfStock }: { outOfStock: boolean }) {
  if (outOfStock) {
    return (
      <div className="mt-7 space-y-3">
        <div
          aria-disabled
          className="flex w-full items-center justify-center gap-2 rounded-md bg-paper-300 px-6 py-3.5 text-sm font-medium text-ink-400 sm:w-auto sm:px-10"
        >
          Out of stock
        </div>
        <p className="text-sm leading-relaxed text-ink-500">
          We grind to order rather than holding inventory, so this goes out of stock until the
          next batch.{' '}
          <Link href="/contact" className="text-gold-700 underline underline-offset-2">
            Ask us when it is back
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-3">
      {/*
        Styled as plainly inert, not as a faded primary button.
        A gold CTA at reduced opacity still reads as the main action on the
        page, so it draws the eye and the tap - and then does nothing. Matching
        the out-of-stock treatment means both non-buyable states look
        non-buyable, and the eye goes to the message underneath instead.
      */}
      <div
        aria-disabled
        className="flex w-full items-center justify-center gap-2 rounded-md bg-paper-300 px-6 py-3.5 text-sm font-medium text-ink-400 sm:w-auto sm:px-10"
      >
        <ShoppingBag className="h-4 w-4" />
        Add to bag
      </div>
      <p className="text-sm text-ink-500">
        Ordering is not switched on yet.{' '}
        <Link href="/contact" className="text-gold-700 underline underline-offset-2">
          Message us to order
        </Link>{' '}
        in the meantime.
      </p>
    </div>
  );
}
