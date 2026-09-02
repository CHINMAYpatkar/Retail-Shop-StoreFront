import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail.
 *
 * An ordered list inside a labelled `nav`, because it is a hierarchy and the
 * order carries meaning. The last item has no href and carries
 * `aria-current="page"` - linking a page to itself is noise for anyone
 * navigating by keyboard.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight aria-hidden className="h-3 w-3" /> : null}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-ink-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-600">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
