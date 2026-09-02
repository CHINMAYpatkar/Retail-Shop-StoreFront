import { describe, expect, it } from 'vitest';
import {
  discountPercent,
  formatPrice,
  hasDiscount,
  isOwnMedia,
  mediaUrl,
  text,
} from './utils';

/**
 * The formatting layer, which is where Decimal-as-string finally becomes a
 * number.
 *
 * The API sends money as strings because Postgres stores it as `Decimal` and
 * Prisma serialises it that way on purpose - so it never round-trips through an
 * IEEE754 double. These functions are the single point where that conversion
 * happens, which makes them the single point where it can go wrong.
 */
describe('formatPrice', () => {
  it('formats a Decimal string as rupees', () => {
    expect(formatPrice('320.00')).toBe('₹320.00');
  });

  it('always shows two decimals, even for a whole-rupee price', () => {
    // Intl gives INR two decimals by default, and that is what we want: a grid
    // where some prices have paise and others do not looks broken.
    expect(formatPrice('180')).toBe('₹180.00');
  });

  it('groups in the Indian numbering system, not in thousands', () => {
    // 1,00,000 not 100,000. Getting this wrong looks obviously foreign to the
    // customers this shop actually serves.
    expect(formatPrice('100000')).toBe('₹1,00,000.00');
  });

  it('returns an empty string for absent values rather than NaN or zero', () => {
    // A missing price must render as nothing, not as "₹NaN" and definitely not
    // as "₹0.00", which reads as free.
    expect(formatPrice(null)).toBe('');
    expect(formatPrice(undefined)).toBe('');
    expect(formatPrice('')).toBe('');
  });

  it('returns an empty string for a non-numeric value', () => {
    expect(formatPrice('not a price')).toBe('');
  });

  it('handles zero as a real price', () => {
    expect(formatPrice('0')).toBe('₹0.00');
  });
});

describe('hasDiscount / discountPercent', () => {
  it('reports a genuine reduction', () => {
    expect(hasDiscount('380.00', '420.00')).toBe(true);
    expect(discountPercent('380.00', '420.00')).toBe(10);
  });

  it('reports no discount when there is no compare price', () => {
    expect(hasDiscount('380.00', null)).toBe(false);
    expect(discountPercent('380.00', null)).toBeNull();
  });

  it('does not treat an equal compare price as a discount', () => {
    expect(hasDiscount('380.00', '380.00')).toBe(false);
  });

  it('does not treat a LOWER compare price as a discount', () => {
    // A compare price below the selling price is a data-entry error. Showing
    // "-11% off" for a price increase would be actively misleading.
    expect(hasDiscount('420.00', '380.00')).toBe(false);
    expect(discountPercent('420.00', '380.00')).toBeNull();
  });

  it('ignores a non-numeric compare price', () => {
    expect(hasDiscount('380.00', 'free')).toBe(false);
  });

  it('rounds to a whole percent', () => {
    // 420 -> 380 is 9.52%, which should read as 10% rather than 9.523809%.
    expect(discountPercent('380', '420')).toBe(10);
  });
});

describe('text', () => {
  it('returns null for blank and whitespace, so ?? fallbacks work', () => {
    // Settings come from admin-entered JSON, where an emptied field arrives as
    // "" or "   " rather than as undefined. Without this every `?? fallback`
    // would silently pass an empty string through and render an empty heading.
    expect(text('')).toBeNull();
    expect(text('   ')).toBeNull();
    expect(text(null)).toBeNull();
    expect(text(undefined)).toBeNull();
  });

  it('trims a real value', () => {
    expect(text('  Aajicha Masala  ')).toBe('Aajicha Masala');
  });
});
