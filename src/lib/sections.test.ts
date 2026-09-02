import { describe, expect, it } from 'vitest';
import { section } from './sections';
import type { HomeSections } from '@/types/api';

/**
 * Home section lookup.
 *
 * Sections are addressed by a stable `key` rather than by array position, so an
 * admin reordering them in the JSON cannot give the featured products the
 * heading meant for the journal.
 */
const SECTIONS: HomeSections = {
  sections: [
    { key: 'featured', heading: 'Ground this week', subheading: 'Fresh', enabled: true },
    { key: 'story', heading: 'Our story', enabled: false },
    { key: 'journal', heading: 'From the journal' },
  ],
};

describe('section', () => {
  it('finds a section by key', () => {
    expect(section(SECTIONS, 'featured')?.heading).toBe('Ground this week');
  });

  it('is unaffected by ordering', () => {
    const reordered: HomeSections = { sections: [...(SECTIONS.sections ?? [])].reverse() };
    expect(section(reordered, 'featured')?.heading).toBe('Ground this week');
  });

  it('treats an explicitly disabled section as absent', () => {
    expect(section(SECTIONS, 'story')).toBeNull();
  });

  it('treats a section with no `enabled` flag as enabled', () => {
    // Absent means "not configured yet", which for a section the admin has
    // bothered to write a heading for should mean on.
    expect(section(SECTIONS, 'journal')?.heading).toBe('From the journal');
  });

  it('returns null for an unknown key', () => {
    expect(section(SECTIONS, 'nope')).toBeNull();
  });

  it('returns null when settings are missing entirely', () => {
    // The state of a brand-new install: no settings written at all. Every
    // caller must render nothing rather than throw.
    expect(section(undefined, 'featured')).toBeNull();
    expect(section({}, 'featured')).toBeNull();
    expect(section({ sections: [] }, 'featured')).toBeNull();
  });
});
