'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn, isOwnMedia, mediaUrl } from '@/lib/utils';

interface MediaProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

/**
 * Renders an image from either our own storage or an admin-pasted URL.
 *
 * Two decisions worth keeping:
 *
 * **`next/image` only for our own host.** It gives resizing, modern formats and
 * lazy loading, but it works solely for hosts declared in `remotePatterns` — an
 * unknown host renders nothing, with only a build-time warning. The backend
 * treats an external URL as a first-class case rather than a fallback, so an
 * admin can legitimately paste a link to any host. A slightly heavier `<img>`
 * beats an invisible image.
 *
 * **A client component, for `onError`.** A URL that is absent and a URL that
 * 404s are different states, and only the second can be detected in the
 * browser. Admins paste external links that later rot, and images get deleted
 * from the media library while a banner still points at them; without this the
 * hero degrades to an empty black box rather than to the warm placeholder.
 * The cost is that the image markup ships as client JS — negligible here, since
 * this component holds no data logic and its parents stay server components.
 */
export function Media({
  src,
  alt,
  className,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
  fallbackClassName,
}: MediaProps) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);

  if (!url || failed) {
    return (
      <div
        aria-hidden
        className={cn(
          'h-full w-full bg-paper-200 bg-[radial-gradient(circle_at_30%_20%,theme(colors.paper.300),transparent_60%)]',
          className,
          fallbackClassName,
        )}
      />
    );
  }

  if (!isOwnMedia(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className={cn(className)}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
