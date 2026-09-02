import { Reveal } from '@/components/motion';
import { text } from '@/lib/utils';

/**
 * A section title and optional standfirst, both admin-managed (`SF-31`).
 *
 * Returns `null` when there is no heading. That is the no-static-content rule
 * in its most concrete form: an unconfigured section renders nothing rather
 * than a placeholder, because a placeholder is hardcoded copy wearing a
 * disguise — and worse, one that ships to customers.
 */
export function SectionHeading({
  heading,
  subheading,
  align = 'left',
}: {
  heading?: string | null;
  subheading?: string | null;
  align?: 'left' | 'center';
}) {
  const title = text(heading);
  if (!title) return null;

  const standfirst = text(subheading);
  const centered = align === 'center';

  return (
    <Reveal className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <h2 className="font-display text-display-sm text-ink-900 sm:text-display-md">{title}</h2>
      {standfirst ? (
        <p className="mt-3 text-[17px] leading-relaxed text-ink-500">{standfirst}</p>
      ) : null}
    </Reveal>
  );
}
