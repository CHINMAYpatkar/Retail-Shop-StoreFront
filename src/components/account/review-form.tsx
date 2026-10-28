'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { customerApi } from '@/lib/customer-api';
import { accountKeys } from '@/hooks/use-account';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

/**
 * Writing a review, from a delivered order.
 *
 * Shown here rather than on the product page because this is the only place the
 * customer is unambiguously entitled to write one: the backend only accepts a
 * review for a product on an order of theirs that reached DELIVERED, so
 * offering the form anywhere else means offering it to people it will refuse.
 *
 * It rejects rather than silently accepting-and-hiding, which is what lets this
 * form tell the customer honestly why it failed - "already reviewed" is a real,
 * actionable answer.
 */
export function ReviewForm({
  productId,
  productName,
  onDone,
}: {
  productId: string;
  productName: string;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: async () =>
      customerApi.post('/customer/reviews', {
        productId,
        rating,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.orders });
      toast.success('Thank you — your review is with us for approval');
      onDone();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Could not save your review.')),
  });

  const shown = hovered || rating;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (rating > 0) submit.mutate();
      }}
      className="mt-4 rounded-lg border border-paper-300 bg-paper-50 p-5"
    >
      <h3 className="font-display text-lg text-ink-900">Review {productName}</h3>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-ink-800">Your rating</legend>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              // A real button per star, labelled: a row of divs with a click
              // handler is unusable by keyboard and silent to a screen reader.
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
              aria-pressed={rating === star}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  star <= shown ? 'fill-gold-500 text-gold-500' : 'fill-none text-ink-200',
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-800">
          Headline <span className="font-normal text-ink-400">(optional)</span>
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={150}
          placeholder="Sums it up in a few words"
          className="w-full rounded-md border border-ink-200 bg-paper-100 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-800">
          Your review <span className="font-normal text-ink-400">(optional)</span>
        </span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="How did it smell, how did it cook, would you buy it again?"
          className="w-full resize-y rounded-md border border-ink-200 bg-paper-100 px-3.5 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={rating === 0 || submit.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
        >
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit review
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-ink-300 px-5 py-2.5 text-sm text-ink-800 transition-colors hover:bg-paper-200"
        >
          Cancel
        </button>
        {rating === 0 ? (
          <span className="text-xs text-ink-400">Choose a rating to continue.</span>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-400">
        Reviews are checked before they appear on the site.
      </p>
    </form>
  );
}
