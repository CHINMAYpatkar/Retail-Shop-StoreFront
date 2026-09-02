import Link from 'next/link';

/**
 * Shown when a filter matches nothing.
 *
 * Always offers a way out. An empty grid with no escape route reads as a broken
 * page, and the customer's only recourse is the back button.
 */
export function EmptyState({
  title,
  description,
  actionHref = '/shop',
  actionLabel = 'Browse everything',
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 px-6 py-20 text-center">
      <h2 className="font-display text-xl text-ink-900">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      ) : null}
      <Link
        href={actionHref}
        className="mt-6 inline-flex items-center rounded-md border border-ink-300 px-5 py-2.5 text-sm text-ink-800 transition-colors hover:border-ink-800 hover:bg-ink-900 hover:text-paper-50"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
