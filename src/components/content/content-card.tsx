import Link from 'next/link';
import { Media } from '@/components/ui/media';
import { text } from '@/lib/utils';

/**
 * A card for a recipe, ingredient or journal post.
 *
 * One component for all three because they are the same shape — image, title,
 * a line of description — and three near-identical cards would drift apart the
 * first time one of them changed.
 */
export function ContentCard({
  href,
  title,
  description,
  imageUrl,
  meta,
  aspect = 'landscape',
}: {
  href: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  meta?: string | null;
  aspect?: 'landscape' | 'square';
}) {
  const summary = text(description);

  return (
    <Link href={href} className="group block">
      <div
        className={`relative overflow-hidden rounded-lg bg-paper-200 ${
          aspect === 'square' ? 'aspect-square' : 'aspect-[3/2]'
        }`}
      >
        <Media
          src={imageUrl}
          alt=""
          className="transition-transform duration-700 ease-spice group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="mt-3.5 space-y-1">
        {meta ? (
          <p className="text-[11px] uppercase tracking-widest text-ink-400">{meta}</p>
        ) : null}
        <h3 className="font-display text-lg leading-snug text-ink-900 transition-colors group-hover:text-gold-700">
          {title}
        </h3>
        {summary ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{summary}</p>
        ) : null}
      </div>
    </Link>
  );
}
