import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toShopHref, type ShopParams } from '@/lib/shop-query';
import { cn } from '@/lib/utils';

/**
 * Pagination as links, so a page is a real URL.
 *
 * Shows a window around the current page rather than every page: a catalogue
 * that grows to 40 pages would otherwise render 40 links, which wraps badly on
 * a phone and is useless to navigate.
 */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const page = current + offset;
    if (page > 1 && page < total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push('gap');
    result.push(page);
  });

  return result;
}

export function Pagination({
  params,
  totalPages,
}: {
  params: ShopParams;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(params.page, totalPages);
  const window = pageWindow(current, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      <Arrow
        href={toShopHref(params, { page: current - 1 })}
        disabled={current <= 1}
        label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Arrow>

      {window.map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden className="px-1.5 text-ink-300">
            &hellip;
          </span>
        ) : (
          <Link
            key={entry}
            href={toShopHref(params, { page: entry })}
            aria-current={entry === current ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 font-data text-sm transition-colors',
              entry === current
                ? 'bg-ink-900 text-paper-50'
                : 'text-ink-600 hover:bg-paper-200 hover:text-ink-900',
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <Arrow
        href={toShopHref(params, { page: current + 1 })}
        disabled={current >= totalPages}
        label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Arrow>
    </nav>
  );
}

function Arrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  // A disabled arrow is a span, not a link with a click handler. There is
  // nowhere to go, so there should be nothing focusable to go there.
  if (disabled) {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-200"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900"
    >
      {children}
    </Link>
  );
}
