/**
 * Runtime configuration, read once.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so these are constants in
 * the browser bundle. Reading them through one module means a missing variable
 * fails in a single obvious place rather than as `undefined` in a URL.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

/**
 * How long a cached catalogue response may be stale, in seconds.
 *
 * Per ADR 0010 the catalogue is incrementally regenerated rather than rendered
 * per request: a spice catalogue changes a few times a week, and paying a
 * database round trip on every visit to catch that is the wrong trade.
 *
 * Content the admin edits and expects to see immediately (CMS pages, settings)
 * uses a shorter window - an admin who changes the footer and sees no change
 * for an hour will reasonably conclude the feature is broken.
 */
export const REVALIDATE = {
  catalogue: 300,
  content: 60,
  /** Reviews move often enough to be worth a short window. */
  reviews: 120,
} as const;
