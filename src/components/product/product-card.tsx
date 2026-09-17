import Link from 'next/link';
import type { ProductCard as ProductCardType } from '@/types/api';
import { Media } from '@/components/ui/media';
import { discountPercent, formatPrice, hasDiscount, text } from '@/lib/utils';
import { WishlistButton } from './wishlist-button';

/**
 * One product in a grid.
 *
 * The image zoom on hover is a transform, not a width change: transforms
 * composite on the GPU, whereas animating width forces layout on every frame
 * and is visibly janky on a mid-range phone. The parent clips the overflow so
 * the scaled image stays inside the card.
 *
 * Stock state is shown honestly rather than hidden. An out-of-stock product
 * that looks buyable until checkout is a worse experience than one that says so
 * on the card.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardType;
  priority?: boolean;
}) {
  const image = product.images?.[0];
  const outOfStock = product.stockQuantity <= 0;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const summary = text(product.shortDescription);

  return (
    <article className="group relative">
      {/* Outside the Link: a button nested in an anchor is invalid markup and
          makes the whole card impossible to activate predictably. */}
      <div className="absolute right-2 top-2 z-10">
        <WishlistButton productId={product.id} productName={product.name} variant="overlay" />
      </div>

      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-paper-200">
          <Media
            src={image?.url}
            alt={text(image?.altText) ?? product.name}
            priority={priority}
            className="transition-transform duration-700 ease-spice group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />

          {discount ? (
            <span className="absolute left-3 top-3 rounded bg-chilli-400 px-2 py-1 text-[11px] font-semibold tracking-wide text-paper-50">
              {discount}% off
            </span>
          ) : null}

          {outOfStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-paper-100/75">
              <span className="rounded bg-ink-900/85 px-3 py-1.5 text-xs font-medium tracking-wide text-paper-50">
                Out of stock
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-3.5 space-y-1">
          {product.category ? (
            <p className="text-[11px] uppercase tracking-widest text-ink-400">
              {product.category.name}
            </p>
          ) : null}

          <h3 className="font-display text-lg leading-snug text-ink-900 transition-colors group-hover:text-gold-700">
            {product.name}
          </h3>

          {summary ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{summary}</p>
          ) : null}

          <p className="flex items-baseline gap-2 pt-0.5" data-numeric>
            <span className="font-data text-[15px] font-medium text-ink-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount(product.price, product.compareAtPrice) ? (
              <span className="font-data text-[13px] text-ink-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
