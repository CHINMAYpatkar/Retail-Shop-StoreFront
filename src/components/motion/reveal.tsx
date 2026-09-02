'use client';

import { m, useInView } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reveal primitives.
 *
 * Every element these render starts at `opacity: 0` and is made visible by
 * JavaScript. That is a real risk on a storefront: if the bundle fails to load,
 * JavaScript is disabled, or the animation never completes, the content is
 * permanently invisible - to customers and to crawlers alike.
 *
 * Two mitigations, both in the root layout:
 *  - a `<noscript>` stylesheet forces `[data-reveal]` visible, so a JS-less
 *    visitor sees the whole page rather than a blank one;
 *  - the markup is still server-rendered, so the text is in the HTML either way
 *    and a crawler that does not execute scripts can read it.
 *
 * Hence the `data-reveal` attribute on each of these - it is the hook that
 * stylesheet targets, not decoration.
 */
type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Whether the element is already within the viewport at mount.
 *
 * Belt and braces for the reveal pattern, and an LCP win besides.
 *
 * `useInView` waits for an IntersectionObserver callback. Above the fold that
 * is pure latency - the content is already visible and we are holding it at
 * `opacity: 0` waiting to be told what we can measure synchronously. Worse, if
 * the observer never fires - an old in-app webview, a privacy mode that stubs
 * it, or simply an environment where it is unreliable - the content stays
 * invisible forever. On a storefront that means a blank page.
 *
 * So: measure directly on mount and show immediately if we are on screen.
 * The observer still handles everything below the fold, and the `<noscript>`
 * rule in the root layout covers the case where none of this runs at all.
 */
function useVisibleOnMount(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
    }
  }, [ref]);

  return visible;
}

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  /** Seconds. Use `Stagger` for lists rather than hand-computing delays. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'header';
}

/**
 * Fades and rises content as it enters the viewport.
 *
 * The workhorse of the scroll storytelling in ADR 0014, so it is worth being
 * precise about what it does and does not do:
 *
 *  - **Transform and opacity only.** Animating width, height, top or margin
 *    forces layout on every frame, which is visible as jank on a mid-range
 *    Android phone - the device most of these customers will actually use.
 *
 *  - **`once: true`.** Content that re-animates every time it scrolls back into
 *    view is distracting and makes a long page feel unstable.
 *
 *  - **Reduced motion is handled by `MotionConfig`**, which zeroes the
 *    transform. The element still appears; it simply does not travel.
 *
 *  - **No `will-change`.** Promoting every revealable element to its own layer
 *    exhausts GPU memory on cheap devices and makes the page slower, not
 *    faster. Framer promotes only while an animation is actually running.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // `-10% 0px` starts the reveal slightly before the element is fully visible,
  // so it reads as already-in-motion rather than as popping in on arrival.
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });
  const alreadyVisible = useVisibleOnMount(ref);
  const show = inView || alreadyVisible;
  const offset = OFFSET[direction];

  /**
   * Polymorphic `as` with a typed ref does not resolve cleanly: `m[as]` is a
   * union of components, and TypeScript intersects their ref types into
   * something no single ref can satisfy. Casting to `m.div` fixes the types
   * while the runtime still renders the requested tag - the cast is about the
   * ref signature, not the element, so the semantic markup is unaffected.
   */
  const MotionTag = m[as] as typeof m.div;

  return (
    <MotionTag
      ref={ref}
      data-reveal
      className={cn(className)}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={show ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between children. Kept small - long staggers feel sluggish. */
  gap?: number;
  as?: 'div' | 'ul' | 'section';
}

/**
 * Reveals children one after another.
 *
 * Uses Framer's variant propagation rather than a computed delay per child, so
 * the timing stays correct when the list length changes - a hand-computed
 * `index * 0.1` on a 40-product grid ends with the last card arriving four
 * seconds late.
 */
export function Stagger({ children, className, gap = 0.06, as = 'div' }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5% 0px' });
  const alreadyVisible = useVisibleOnMount(ref);
  const show = inView || alreadyVisible;
  const MotionTag = m[as] as typeof m.div; // see note in Reveal

  return (
    <MotionTag
      ref={ref}
      data-reveal
      className={cn(className)}
      initial="hidden"
      animate={show ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        // A cap on total stagger time: beyond ~0.5s the last item feels
        // forgotten rather than choreographed.
        visible: { transition: { staggerChildren: gap, delayChildren: 0.05 } },
      }}
    >
      {children}
    </MotionTag>
  );
}

/** A child of `Stagger`. Inherits its timing from the parent's variants. */
export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const MotionTag = m[as] as typeof m.div; // see note in Reveal

  return (
    <MotionTag
      data-reveal
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </MotionTag>
  );
}
