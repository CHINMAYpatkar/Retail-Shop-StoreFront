import type { HomeSection, HomeSections } from '@/types/api';

/**
 * Reads one home section's copy from the `home_sections` setting (`SF-31`).
 *
 * Sections are addressed by a stable `key` rather than by array position, so
 * an admin reordering them in the JSON cannot accidentally give the featured
 * products the heading meant for the journal.
 *
 * A section with no entry, or with `enabled: false`, is treated as absent. The
 * caller renders nothing — which is the point: the page composes itself from
 * whatever the admin has actually written.
 */
export function section(
  sections: HomeSections | undefined,
  key: string,
): HomeSection | null {
  const match = sections?.sections?.find((entry) => entry.key === key);
  if (!match) return null;
  if (match.enabled === false) return null;
  return match;
}
