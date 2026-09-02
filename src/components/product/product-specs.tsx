import type { ProductDetail } from '@/types/api';
import { text } from '@/lib/utils';

/**
 * The practical details: weight, shelf life, storage, SKU.
 *
 * Rendered as a description list, which is what this actually is - a set of
 * term/value pairs - so a screen reader announces each label with its value
 * instead of reading a flat run of text.
 *
 * Every row is omitted when its value is absent, and the whole block disappears
 * if none are set. A product with no shelf life recorded should not show
 * "Shelf life: —".
 */
export function ProductSpecs({ product }: { product: ProductDetail }) {
  const rows: { label: string; value: string }[] = [];

  if (product.weightGrams) rows.push({ label: 'Weight', value: `${product.weightGrams}g` });
  if (product.shelfLifeDays) {
    rows.push({ label: 'Best within', value: `${product.shelfLifeDays} days of grinding` });
  }
  if (text(product.storageInstructions)) {
    rows.push({ label: 'Storage', value: product.storageInstructions as string });
  }
  if (text(product.sku)) rows.push({ label: 'SKU', value: product.sku as string });

  if (rows.length === 0) return null;

  return (
    <dl className="mt-8 divide-y divide-paper-300 border-t border-paper-300 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-4 py-3">
          <dt className="w-28 shrink-0 text-ink-400">{row.label}</dt>
          <dd className="leading-relaxed text-ink-700">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
