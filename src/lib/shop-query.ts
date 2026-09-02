/**
 * Translates the shop page's URL into an API query, and back into UI state.
 *
 * The URL is the single source of truth for filters and paging - not component
 * state. That is what makes a filtered listing shareable, bookmarkable, and
 * survivable across a back button, and it is why this page can stay
 * server-rendered and cached rather than becoming a client-side app.
 *
 * Every value is validated here rather than passed through. Query strings are
 * user-editable, so `?sort=DROP TABLE` and `?page=-5` are things that will
 * arrive; an unrecognised value falls back to the default instead of reaching
 * the API and returning a 400 the customer cannot act on.
 */

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
] as const;

export type SortValue = (typeof SORTS)[number]['value'];

const SORT_VALUES = SORTS.map((s) => s.value) as readonly string[];

/** Matches the backend's `PaginationQueryDto`, which caps `limit` at 100. */
export const PAGE_SIZE = 12;

export interface ShopParams {
  page: number;
  category: string | null;
  sort: SortValue;
  search: string | null;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parseShopParams(raw: RawParams): ShopParams {
  const pageRaw = Number(first(raw.page));
  // Not just `|| 1`: NaN, 0, -5 and 1e9 all have to land somewhere sensible.
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? Math.min(pageRaw, 10_000) : 1;

  const sortRaw = first(raw.sort);
  const sort = (sortRaw && SORT_VALUES.includes(sortRaw) ? sortRaw : 'newest') as SortValue;

  const category = first(raw.category)?.trim() || null;
  const search = first(raw.search)?.trim() || null;

  return { page, category, sort, search };
}

/** Builds the query string for the API call. */
export function toApiQuery(params: ShopParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(PAGE_SIZE),
    sort: params.sort,
  });

  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);

  return `?${query.toString()}`;
}

/**
 * Builds a storefront URL with some params changed.
 *
 * Changing a filter always returns to page 1. Staying on page 4 while
 * switching to a category that has two products shows an empty grid and looks
 * broken, so the page is reset unless it is the thing being changed.
 */
export function toShopHref(current: ShopParams, changes: Partial<ShopParams>): string {
  const next: ShopParams = { ...current, ...changes };
  if (!('page' in changes)) next.page = 1;

  const query = new URLSearchParams();
  if (next.category) query.set('category', next.category);
  if (next.sort !== 'newest') query.set('sort', next.sort);
  if (next.search) query.set('search', next.search);
  if (next.page > 1) query.set('page', String(next.page));

  const qs = query.toString();
  return qs ? `/shop?${qs}` : '/shop';
}
