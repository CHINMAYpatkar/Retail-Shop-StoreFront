import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MEDIA_URL } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Decimal-as-string price for display.
 *
 * Takes a string because that is how the API sends money, and parses exactly
 * once, here, at the point of display. Parsing earlier and passing numbers
 * around is how a price becomes 249.99000000000001 three components later.
 */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/** True when `compareAtPrice` represents a genuine reduction worth showing. */
export function hasDiscount(price: string, compareAtPrice: string | null): boolean {
  if (!compareAtPrice) return false;
  const now = Number(price);
  const was = Number(compareAtPrice);
  return Number.isFinite(now) && Number.isFinite(was) && was > now;
}

export function discountPercent(price: string, compareAtPrice: string | null): number | null {
  if (!hasDiscount(price, compareAtPrice)) return null;
  const now = Number(price);
  const was = Number(compareAtPrice as string);
  return Math.round(((was - now) / was) * 100);
}

/**
 * Whether a media URL points at our own storage.
 *
 * Admins may paste an external URL, which the backend supports as a first-class
 * case. `next/image` needs every host declared in `remotePatterns` up front, so
 * an unknown host renders nothing. Our own media goes through `next/image`;
 * anything else falls back to a plain `<img>`, which always renders.
 */
export function isOwnMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    return new URL(url).origin === new URL(MEDIA_URL).origin;
  } catch {
    return false;
  }
}

/** Turns a possibly-relative storage URL into something an <img> can load. */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${MEDIA_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Trims a string setting and returns null for blank, so `??` fallbacks work. */
export function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
