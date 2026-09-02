'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Motion for the whole site, configured once.
 *
 * ADR 0014 chose rich, expressive animation over a lighter option. That is a
 * defensible call for a storytelling product, but it makes performance and
 * accessibility standing obligations rather than polish. Three of those
 * obligations are discharged here, at the root, so no individual component can
 * forget them:
 *
 *  - `LazyMotion` with `domAnimation` loads the animation features as a
 *    separate chunk and drops roughly 20kB from the initial bundle. Components
 *    must use `m.div` rather than `motion.div` for this to hold; importing
 *    `motion` anywhere pulls the full bundle back in and silently undoes it.
 *
 *  - `reducedMotion="user"` makes Framer honour `prefers-reduced-motion`
 *    automatically for transform and layout animations. Vestibular disorders
 *    are common and scroll-driven motion is a genuine trigger, not a taste
 *    preference. Components with hand-rolled scroll effects still have to check
 *    the preference themselves - see `useReducedMotionSafe`.
 *
 *  - One shared easing curve. Motion that shares a curve reads as one system;
 *    mixed curves read as several things happening near each other.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
