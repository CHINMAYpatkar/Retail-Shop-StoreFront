'use client';

import { useEffect, useState } from 'react';

/**
 * `prefers-reduced-motion`, safe to call during server rendering.
 *
 * Framer's `MotionConfig reducedMotion="user"` already covers its own
 * animations. This is for the hand-rolled cases it cannot see: parallax bound
 * to scroll position, autoplaying video, staggered reveals driven by an
 * observer. Those have to opt out themselves.
 *
 * Returns `true` until the effect runs. Defaulting to "reduced" means the very
 * first paint is the still version for everyone, and motion is added once the
 * preference is actually known - the wrong way round would flash a full
 * animation at someone who asked not to see one, which is precisely the harm
 * the setting exists to prevent.
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
