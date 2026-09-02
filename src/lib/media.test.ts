import { describe, expect, it } from 'vitest';
import { isOwnMedia, mediaUrl } from './utils';

/**
 * Media URL handling.
 *
 * The backend supports an admin pasting an external URL as a first-class case,
 * not a fallback. `next/image` only works for hosts declared in
 * `remotePatterns` and renders NOTHING for an unknown one, so getting this
 * wrong means silently invisible images with only a build-time warning.
 *
 * `NEXT_PUBLIC_MEDIA_URL` is inlined at build time; these specs run against
 * whatever the environment supplies, so they assert the RELATIONSHIP rather
 * than a hardcoded host.
 */
const OWN = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:4000';

describe('isOwnMedia', () => {
  it('recognises an absolute URL on our own media host', () => {
    expect(isOwnMedia(`${OWN}/uploads/public/products/2026/09/x.webp`)).toBe(true);
  });

  it('recognises a root-relative path as ours', () => {
    expect(isOwnMedia('/uploads/public/products/2026/09/x.webp')).toBe(true);
  });

  it('treats a third-party host as external', () => {
    expect(isOwnMedia('https://cdn.example.test/photo.jpg')).toBe(false);
  });

  it('treats a lookalike host as external', () => {
    // A prefix or substring check would wrongly accept this.
    expect(isOwnMedia('https://localhost.evil.test/photo.jpg')).toBe(false);
  });

  it('is false for absent or unparseable values', () => {
    expect(isOwnMedia(null)).toBe(false);
    expect(isOwnMedia(undefined)).toBe(false);
    expect(isOwnMedia('')).toBe(false);
    expect(isOwnMedia('not a url')).toBe(false);
  });
});

describe('mediaUrl', () => {
  it('leaves an absolute URL alone', () => {
    expect(mediaUrl('https://cdn.example.test/a.jpg')).toBe('https://cdn.example.test/a.jpg');
    expect(mediaUrl('http://cdn.example.test/a.jpg')).toBe('http://cdn.example.test/a.jpg');
  });

  it('prefixes a root-relative path with the media host', () => {
    expect(mediaUrl('/uploads/public/x.webp')).toBe(`${OWN}/uploads/public/x.webp`);
  });

  it('adds the missing slash for a bare path', () => {
    expect(mediaUrl('uploads/public/x.webp')).toBe(`${OWN}/uploads/public/x.webp`);
  });

  it('never produces a double slash between host and path', () => {
    const result = mediaUrl('/uploads/x.webp') as string;
    expect(result.replace(/^https?:\/\//, '')).not.toContain('//');
  });

  it('returns null for absent values so the caller can render a placeholder', () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });
});
