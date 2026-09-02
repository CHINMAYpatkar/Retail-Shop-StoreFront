import type { ProductDetail } from '@/types/api';
import { mediaUrl, text } from '@/lib/utils';
import { SITE_URL } from '@/lib/config';

/**
 * schema.org Product JSON-LD.
 *
 * This is how a spice blend shows up in search with its price and rating
 * attached rather than as a bare blue link, which is worth real traffic to a
 * small shop.
 *
 * Two things it must not do:
 *  - **Claim a rating that does not exist.** `aggregateRating` with zero
 *    reviews is invalid structured data and can earn a manual penalty, so the
 *    block is omitted entirely until there is at least one review.
 *  - **Lie about availability.** `InStock` on a sold-out product is exactly the
 *    mismatch between markup and page that gets rich results revoked.
 */
export function ProductStructuredData({
  product,
  shopName,
}: {
  product: ProductDetail;
  shopName: string | null;
}) {
  const image = mediaUrl(product.images?.[0]?.url);
  const description = text(product.metaDescription) ?? text(product.shortDescription);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `${SITE_URL}/shop/${product.slug}`,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    ...(text(product.sku) ? { sku: product.sku } : {}),
    ...(shopName ? { brand: { '@type': 'Brand', name: shopName } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/shop/${product.slug}`,
    },
  };

  if (product.ratingCount > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAverage.toFixed(1),
      reviewCount: product.ratingCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Safe: every value comes from our own API and is serialised by
      // JSON.stringify, which escapes the characters that could break out of
      // the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
