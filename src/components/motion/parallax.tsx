'use client';

import { m, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotionSafe } from './use-reduced-motion-safe';

interface ParallaxProps {
  children: ReactNode;
  /** Travel in pixels across the full scroll of the container. Keep modest. */
  distance?: number;
  className?: string;
}

/**
 * Moves content slightly slower than the page as it scrolls.
 *
 * Used for the hero image (ADR 0014). Three constraints are deliberate:
 *
 *  - **Reduced motion disables it entirely**, checked explicitly. Framer's
 *    `MotionConfig` cannot help here, because this is driven by scroll
 *    position rather than by a transition, so nothing would otherwise opt out.
 *    Scroll-linked movement is a common vestibular trigger.
 *
 *  - **`useScroll` is scoped to a ref**, not the window. A window-scoped
 *    listener recalculates for every parallax element on the page on every
 *    frame; a scoped one only runs while its own container is in view.
 *
 *  - **The distance is small by default.** Large parallax offsets look
 *    impressive on a desktop monitor and cause visible tearing on a phone,
 *    where the compositor has far less headroom.
 */
export function Parallax({ children, distance = 60, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2]);

  if (reduced) {
    return (
      <div ref={ref} className={cn('relative', className)}>
        {children}
      </div>
    );
  }

  return (
    // `relative` is required: useScroll warns and mis-measures against a
    // statically positioned target.
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <m.div style={{ y }} className="h-full w-full">
        {children}
      </m.div>
    </div>
  );
}
