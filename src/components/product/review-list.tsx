import { BadgeCheck } from 'lucide-react';
import type { Review } from '@/types/api';
import { RatingStars } from './rating-stars';
import { Media } from '@/components/ui/media';
import { text } from '@/lib/utils';

/**
 * Approved customer reviews.
 *
 * Only reviews on a delivered order can be written at all, and only approved
 * ones are returned by the API - so `isVerifiedPurchase` is shown rather than
 * assumed, because it is the single most useful signal on this page.
 *
 * `adminReply` is rendered when present. A shop that answers its reviews in
 * public is doing the most persuasive thing available to it, and hiding the
 * reply would waste that.
 */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-500">
        No reviews yet. Only customers who have received an order can leave one.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-paper-300">
      {reviews.map((review) => {
        const name = text(review.customer?.name) ?? 'A customer';
        const title = text(review.title);
        const comment = text(review.comment);

        return (
          <li key={review.id} className="py-6 first:pt-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <RatingStars rating={review.rating} />
              <span className="text-sm font-medium text-ink-800">{name}</span>
              {review.isVerifiedPurchase ? (
                <span className="inline-flex items-center gap-1 text-xs text-gold-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified purchase
                </span>
              ) : null}
              <time
                dateTime={review.createdAt}
                className="ml-auto font-data text-xs text-ink-400"
              >
                {formatReviewDate(review.createdAt)}
              </time>
            </div>

            {title ? <h3 className="mt-2.5 font-medium text-ink-900">{title}</h3> : null}
            {comment ? (
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{comment}</p>
            ) : null}

            {review.images.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {review.images.map((image) => (
                  <li
                    key={image.id}
                    className="relative h-20 w-20 overflow-hidden rounded-md bg-paper-200"
                  >
                    <Media src={image.url} alt="" sizes="80px" />
                  </li>
                ))}
              </ul>
            ) : null}

            {text(review.adminReply) ? (
              <div className="mt-4 rounded-md border-l-2 border-gold-300 bg-paper-200/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                  Our reply
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">
                  {review.adminReply}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Formatted with an explicit locale and UTC.
 *
 * Left to the server's defaults, this renders differently on the server than in
 * the browser and React reports a hydration mismatch.
 */
function formatReviewDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
