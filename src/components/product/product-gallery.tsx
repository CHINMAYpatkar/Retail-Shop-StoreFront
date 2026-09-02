'use client';

import { useState } from 'react';
import { Media } from '@/components/ui/media';
import type { ProductImage } from '@/types/api';
import { cn, text } from '@/lib/utils';

/**
 * Product image gallery.
 *
 * A client component because selecting a thumbnail is genuinely interactive.
 * Deliberately small in scope: no lightbox, no zoom, no carousel library. The
 * main image is a real `<Media>` so it still gets optimisation and the
 * placeholder fallback.
 *
 * Thumbnails are buttons, not divs with onClick - they need to be focusable and
 * operable from the keyboard, and `aria-pressed` says which one is showing.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const active = images[index];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-paper-200">
        <Media
          src={active?.url}
          alt={text(active?.altText) ?? productName}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2.5">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
                aria-label={`View image ${i + 1} of ${images.length}`}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-md bg-paper-200 transition-all',
                  i === index
                    ? 'ring-2 ring-gold-500 ring-offset-1 ring-offset-paper-100'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <Media
                  src={image.url}
                  alt=""
                  sizes="120px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
