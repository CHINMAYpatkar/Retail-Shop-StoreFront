import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * Deliberately offers routes rather than just an apology. A product that sold
 * out and was deleted, or a mistyped URL, should still put the customer one
 * click from the shelf.
 *
 * The copy here is interface chrome, not shop content - which is why it is in
 * code rather than the CMS. A 404 that depends on a successful API call is a
 * 404 that breaks when the API is the reason you are seeing it.
 */
export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-data text-sm tracking-widest text-gold-700">404</p>
      <h1 className="mt-3 font-display text-display-sm text-ink-900 sm:text-display-md">
        We could not find that
      </h1>
      <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-500">
        The page may have moved, or a product may have sold out and been retired. The shelf is
        still here.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center rounded-md bg-gold-500 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400"
        >
          Browse the shelf
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-ink-300 px-6 py-3 text-sm text-ink-800 transition-colors hover:border-ink-800 hover:bg-ink-900 hover:text-paper-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
