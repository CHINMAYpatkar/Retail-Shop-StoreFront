import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { SORTS, toShopHref, type ShopParams } from '@/lib/shop-query';
import { cn } from '@/lib/utils';

/**
 * Sort control.
 *
 * A CSS-only disclosure rather than a JavaScript dropdown: `group-focus-within`
 * plus `group-hover` opens it, and every option is a real link. That keeps the
 * shop page a server component and means sorting still works before (or
 * without) hydration.
 *
 * Keyboard users get it from `focus-within`, which is why the trigger is a
 * `<button>` and the options are links - both are natively focusable, so
 * tabbing into the group opens the panel without any key handlers.
 */
export function SortSelect({ params }: { params: ShopParams }) {
  const current = SORTS.find((s) => s.value === params.sort) ?? SORTS[0];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border border-ink-200 bg-paper-50 px-3.5 py-2 text-sm text-ink-700 transition-colors hover:border-ink-300"
        aria-haspopup="menu"
      >
        <span className="text-ink-400">Sort</span>
        <span>{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400 transition-transform group-focus-within:rotate-180" />
      </button>

      <ul
        role="menu"
        className="invisible absolute right-0 z-20 mt-1 w-56 rounded-md border border-ink-200 bg-paper-50 p-1 opacity-0 shadow-lift transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {SORTS.map((option) => (
          <li key={option.value} role="none">
            <Link
              role="menuitem"
              href={toShopHref(params, { sort: option.value })}
              aria-current={option.value === params.sort ? 'true' : undefined}
              className={cn(
                'block rounded px-2.5 py-2 text-sm transition-colors',
                option.value === params.sort
                  ? 'bg-paper-200 text-ink-900'
                  : 'text-ink-600 hover:bg-paper-200 hover:text-ink-900',
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
