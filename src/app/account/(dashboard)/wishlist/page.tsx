'use client';

import { useWishlist } from '@/hooks/use-account';
import { ProductCard } from '@/components/product/product-card';
import { EmptyState } from '@/components/shop/empty-state';

export default function WishlistPage() {
  const { data: items, isLoading } = useWishlist();

  return (
    <div>
      <h1 className="font-display text-display-sm text-ink-900">Wishlist</h1>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="aspect-[4/5] animate-pulse rounded-lg bg-paper-200" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            description="Save a blend you want to come back to and it will wait here."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                {/* Removal is the heart on the card itself - ProductCard now
                    carries a WishlistButton, and a second remove control in the
                    same corner would sit directly on top of it. */}
                <ProductCard product={item.product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
