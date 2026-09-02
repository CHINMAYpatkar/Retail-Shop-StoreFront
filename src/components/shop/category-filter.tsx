import Link from 'next/link';
import type { Category } from '@/types/api';
import { cn } from '@/lib/utils';
import { toShopHref, type ShopParams } from '@/lib/shop-query';

/**
 * Category filter, rendered as links rather than as a client-side control.
 *
 * Links keep the shop page a server component: each filter is a real URL, so
 * it is shareable, crawlable and works with the back button, and the result
 * comes from the cache rather than a client fetch. A `<select>` with an
 * onChange would force the whole listing to become interactive for no gain.
 */
export function CategoryFilter({
  categories,
  params,
}: {
  categories: Category[];
  params: ShopParams;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Filter by category">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">
        Category
      </h2>
      <ul className="space-y-1">
        <li>
          <FilterLink
            href={toShopHref(params, { category: null })}
            active={params.category === null}
          >
            Everything
          </FilterLink>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <FilterLink
              href={toShopHref(params, { category: category.slug })}
              active={params.category === category.slug}
            >
              {category.name}
            </FilterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      // aria-current so a screen reader knows which filter is applied; colour
      // alone is not an accessible way to say "selected".
      aria-current={active ? 'true' : undefined}
      className={cn(
        'block rounded px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-ink-900 text-paper-50'
          : 'text-ink-600 hover:bg-paper-200 hover:text-ink-900',
      )}
    >
      {children}
    </Link>
  );
}
