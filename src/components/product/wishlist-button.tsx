'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

/**
 * Save a product for later.
 *
 * The wishlist had no way in until now - the page existed and the account
 * summary counted it, but nothing could add to it. Worth noting because it is
 * the same failure as before: it compiled, it rendered, and it was unreachable.
 *
 * A signed-out visitor is sent to sign in with `next` pointing back here, so
 * they land on the product they were looking at rather than a generic account
 * page and have to find it again.
 */
export function WishlistButton({
  productId,
  productName,
  variant = 'inline',
}: {
  productId: string;
  productName: string;
  /** `inline` sits beside the add-to-bag button; `overlay` floats on a card. */
  variant?: 'inline' | 'overlay';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSaved, canToggle, toggle } = useWishlistToggle(productId);

  const label = isSaved ? `Remove ${productName} from wishlist` : `Save ${productName} for later`;

  function handleClick() {
    if (!canToggle) {
      toast.info('Sign in to save this for later');
      router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    toggle.mutate(undefined, {
      onSuccess: (nowSaved) =>
        toast.success(nowSaved ? 'Saved to your wishlist' : 'Removed from your wishlist'),
      onError: (error) => toast.error(getErrorMessage(error, 'Could not update your wishlist.')),
    });
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isSaved}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper-100/90 text-ink-600 shadow-soft transition-colors hover:bg-paper-50 hover:text-chilli-400"
      >
        {toggle.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={cn('h-4 w-4', isSaved && 'fill-chilli-400 text-chilli-400')} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isSaved}
      disabled={toggle.isPending}
      className={cn(
        'inline-flex h-[50px] items-center justify-center gap-2 rounded-md border px-5 text-sm transition-colors',
        isSaved
          ? 'border-chilli-300 bg-chilli-50 text-chilli-500 hover:bg-chilli-100'
          : 'border-ink-300 text-ink-700 hover:border-ink-800 hover:bg-paper-200',
      )}
    >
      {toggle.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn('h-4 w-4', isSaved && 'fill-chilli-400 text-chilli-400')} />
      )}
      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
