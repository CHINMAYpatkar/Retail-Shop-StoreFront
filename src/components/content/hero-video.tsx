'use client';

import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '@/lib/utils';
import { useReducedMotionSafe } from '@/components/motion';

/**
 * The optional hero video, layered over the banner image.
 *
 * Autoplaying background video is the single heaviest thing on this page, so
 * it is deliberately conservative:
 *
 *  - **Not rendered at all under `prefers-reduced-motion`.** Looping video is
 *    exactly the kind of ambient movement that setting exists to stop, and
 *    muting it does not help.
 *
 *  - **Not rendered on a small viewport.** It would burn a phone's data and
 *    battery for something largely hidden behind the headline, and the poster
 *    image already carries the composition.
 *
 *  - **`preload="none"` until the decision is made**, so the bytes are never
 *    requested for a visitor who will not see it. This is the difference
 *    between a hero that costs 40kB and one that costs several megabytes.
 *
 *  - **Fades in on `canplay`.** Cutting straight from poster to first frame is
 *    a visible flash; the image stays until the video can actually play.
 *
 *  - `muted` and `playsInline` are required for autoplay to be permitted at
 *    all on iOS and in Chrome.
 */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const reduced = useReducedMotionSafe();
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reduced) {
      setAllowed(false);
      return;
    }
    const query = window.matchMedia('(min-width: 768px)');
    setAllowed(query.matches);

    const onChange = (event: MediaQueryListEvent) => setAllowed(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [reduced]);

  if (!allowed) return null;

  const url = mediaUrl(src);
  const posterUrl = mediaUrl(poster);
  if (!url) return null;

  return (
    <video
      ref={ref}
      // `key` on the URL so swapping the banner in admin remounts the element
      // rather than leaving the old source playing.
      key={url}
      src={url}
      {...(posterUrl ? { poster: posterUrl } : {})}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      onCanPlay={() => setReady(true)}
      className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
