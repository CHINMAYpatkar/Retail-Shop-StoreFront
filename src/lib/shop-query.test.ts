import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, parseShopParams, toApiQuery, toShopHref } from './shop-query';

/**
 * URL to API query, and back.
 *
 * The URL is the source of truth for filters and paging, which is what makes a
 * filtered listing shareable and lets the shop page stay server-rendered. It
 * also means every value here is user-editable: `?page=-5` and
 * `?sort=nonsense` are things that will arrive, and they must not reach the
 * API and come back as a 400 the customer cannot act on.
 */
describe('parseShopParams', () => {
  it('defaults everything when the query is empty', () => {
    expect(parseShopParams({})).toEqual({
      page: 1,
      category: null,
      sort: 'newest',
      search: null,
    });
  });

  it('reads a valid query', () => {
    expect(parseShopParams({ page: '3', category: 'blends', sort: 'price_asc', search: 'garam' })).toEqual({
      page: 3,
      category: 'blends',
      sort: 'price_asc',
      search: 'garam',
    });
  });

  describe('rejects unusable page values', () => {
    it.each([
      ['zero', '0'],
      ['negative', '-5'],
      ['not a number', 'abc'],
      ['a float', '2.5'],
      ['empty', ''],
    ])('falls back to page 1 for %s', (_label, value) => {
      expect(parseShopParams({ page: value }).page).toBe(1);
    });

    it('caps an absurdly large page rather than passing it through', () => {
      // Without a cap this becomes `skip: (1e9 - 1) * 12` on the database.
      expect(parseShopParams({ page: '1000000000' }).page).toBe(10_000);
    });
  });

  it('falls back to the default sort for an unrecognised value', () => {
    expect(parseShopParams({ sort: 'nonsense' }).sort).toBe('newest');
    expect(parseShopParams({ sort: 'DROP TABLE products' }).sort).toBe('newest');
  });

  it('treats blank and whitespace-only filters as absent', () => {
    const params = parseShopParams({ category: '   ', search: '  ' });
    expect(params.category).toBeNull();
    expect(params.search).toBeNull();
  });

  it('takes the first value when a param is repeated', () => {
    // `?category=a&category=b` arrives as an array.
    expect(parseShopParams({ category: ['blends', 'spices'] }).category).toBe('blends');
  });
});

describe('toApiQuery', () => {
  it('always sends page, limit and sort', () => {
    const query = toApiQuery(parseShopParams({}));
    expect(query).toContain('page=1');
    expect(query).toContain(`limit=${PAGE_SIZE}`);
    expect(query).toContain('sort=newest');
  });

  it('omits absent filters rather than sending empty values', () => {
    // `category=` would be an empty-string filter matching nothing.
    const query = toApiQuery(parseShopParams({}));
    expect(query).not.toContain('category=');
    expect(query).not.toContain('search=');
  });

  it('url-encodes a search term', () => {
    const query = toApiQuery(parseShopParams({ search: 'garam masala & more' }));
    expect(query).toContain('search=garam+masala+%26+more');
  });

  it('keeps limit within the API cap of 100', () => {
    expect(PAGE_SIZE).toBeLessThanOrEqual(100);
  });
});

describe('toShopHref', () => {
  it('returns a bare /shop when nothing is set', () => {
    expect(toShopHref(parseShopParams({}), {})).toBe('/shop');
  });

  it('omits default values, so the canonical listing has a clean URL', () => {
    // `?sort=newest&page=1` is the same page as `/shop` and should not be a
    // second URL for it.
    expect(toShopHref(parseShopParams({ sort: 'newest', page: '1' }), {})).toBe('/shop');
  });

  it('resets to page 1 when a filter changes', () => {
    // Staying on page 4 while switching to a category with two products shows
    // an empty grid and looks broken.
    const current = parseShopParams({ page: '4', category: 'blends' });
    expect(toShopHref(current, { category: 'spices' })).toBe('/shop?category=spices');
  });

  it('does not reset the page when the page itself is what changed', () => {
    const current = parseShopParams({ page: '4', category: 'blends' });
    expect(toShopHref(current, { page: 5 })).toBe('/shop?category=blends&page=5');
  });

  it('preserves the other filters when one changes', () => {
    const current = parseShopParams({ category: 'blends', search: 'hot' });
    expect(toShopHref(current, { sort: 'price_desc' })).toBe(
      '/shop?category=blends&sort=price_desc&search=hot',
    );
  });

  it('clears a filter when passed null', () => {
    const current = parseShopParams({ category: 'blends', sort: 'price_asc' });
    expect(toShopHref(current, { category: null })).toBe('/shop?sort=price_asc');
  });
});
