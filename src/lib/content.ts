import 'server-only';
import { get, getOptional } from './server-api';
import { REVALIDATE } from './config';
import type {
  Banner,
  Category,
  CmsPage,
  Faq,
  IngredientSummary,
  Paginated,
  ProductCard,
  ProductDetail,
  PublicSettings,
  RecipeSummary,
} from '@/types/api';

/**
 * Every piece of admin-managed content the storefront renders.
 *
 * One module rather than a call per component, so it is possible to answer
 * "what does this site read from the API?" by reading a single file - and so
 * the fallbacks live in one place instead of being reinvented per component.
 *
 * The fallbacks are deliberately structural, never editorial. An empty array,
 * a null, an untitled section: all fine. What must never appear here is
 * marketing copy, because a hardcoded default is exactly the static content the
 * storefront is required not to have. A section with no heading does not
 * render; it does not render a guess.
 */

export async function getSettings(): Promise<PublicSettings> {
  // Never optional: without settings there is no shop name, no footer and no
  // navigation. An empty object is still a valid render - the components all
  // handle absent keys - but the failure is worth seeing in the log.
  const settings = await getOptional<PublicSettings>('settings/public', {
    revalidate: REVALIDATE.content,
    tags: ['settings'],
  });
  return settings ?? {};
}

export async function getBanners(placement?: string): Promise<Banner[]> {
  const query = placement ? `?placement=${encodeURIComponent(placement)}` : '';
  const banners = await getOptional<Banner[]>(`banners${query}`, {
    revalidate: REVALIDATE.content,
    tags: ['banners'],
  });
  return banners ?? [];
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const page = await getOptional<Paginated<ProductCard>>(
    `products?featured=true&limit=${limit}`,
    { revalidate: REVALIDATE.catalogue, tags: ['products'] },
  );
  return page?.items ?? [];
}

export async function getProducts(search: string): Promise<Paginated<ProductCard> | null> {
  return getOptional<Paginated<ProductCard>>(`products${search}`, {
    revalidate: REVALIDATE.catalogue,
    tags: ['products'],
  });
}

/** Throws on a missing product so the route can render a proper 404. */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  return getOptional<ProductDetail>(`products/${encodeURIComponent(slug)}`, {
    revalidate: REVALIDATE.catalogue,
    tags: ['products', `product:${slug}`],
  });
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  return getOptional<CmsPage>(`cms/pages/${encodeURIComponent(slug)}`, {
    revalidate: REVALIDATE.content,
    tags: ['cms', `cms:${slug}`],
  });
}

export async function getFaqs(): Promise<Faq[]> {
  const faqs = await getOptional<Faq[]>('faqs', {
    revalidate: REVALIDATE.content,
    tags: ['faqs'],
  });
  return faqs ?? [];
}

/**
 * Every product slug, for `generateStaticParams`.
 *
 * Called at build time so product pages are prerendered and then incrementally
 * revalidated (ADR 0010) rather than server-rendered on every request.
 *
 * Returns an empty array when the API is unreachable, which is the normal case
 * in CI or when building without a backend. That is not a failure: with no
 * params, Next renders each product on demand instead, and `dynamicParams`
 * (true by default) means a product added after the build still works.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  const page = await getOptional<Paginated<ProductCard>>('products?limit=100', {
    revalidate: REVALIDATE.catalogue,
    tags: ['products'],
  });
  return (page?.items ?? []).map((product) => product.slug);
}

export async function getCategories(): Promise<Category[]> {
  const categories = await getOptional<Category[]>('categories', {
    revalidate: REVALIDATE.catalogue,
    tags: ['categories'],
  });
  return categories ?? [];
}

export async function getIngredients(): Promise<IngredientSummary[]> {
  const ingredients = await getOptional<IngredientSummary[]>('ingredients', {
    revalidate: REVALIDATE.content,
    tags: ['ingredients'],
  });
  return ingredients ?? [];
}

export async function getRecipes(): Promise<RecipeSummary[]> {
  const recipes = await getOptional<RecipeSummary[]>('recipes', {
    revalidate: REVALIDATE.content,
    tags: ['recipes'],
  });
  return recipes ?? [];
}

export { get, getOptional };
