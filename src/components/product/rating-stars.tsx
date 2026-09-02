import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A star rating.
 *
 * The visible stars are decorative and hidden from assistive tech; the actual
 * value is announced once as text. Five separate star icons read aloud as
 * "star star star star star", which tells a screen-reader user nothing.
 */
export function RatingStars({
  rating,
  count,
  size = 'sm',
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}) {
  const rounded = Math.round(rating);
  const px = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              px,
              star <= rounded ? 'fill-gold-500 text-gold-500' : 'fill-none text-ink-200',
            )}
          />
        ))}
      </span>
      <span className="sr-only">
        Rated {rating.toFixed(1)} out of 5
        {count !== undefined ? ` from ${count} ${count === 1 ? 'review' : 'reviews'}` : ''}
      </span>
      {count !== undefined ? (
        <span className="font-data text-xs text-ink-400" data-numeric>
          {rating.toFixed(1)} ({count})
        </span>
      ) : null}
    </span>
  );
}
