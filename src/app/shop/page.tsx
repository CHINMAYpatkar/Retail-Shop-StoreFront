import type { Metadata } from 'next';
import { getCategories, getProducts, getSettings } from '@/lib/content';
import { parseShopParams, toApiQuery } from '@/lib/shop-query';
import { text } from '@/lib/utils';
import { ProductGrid } from '@/components/product/product-grid';
import { CategoryFilter } from '@/components/shop/category-filter';
import { SortSelect } from '@/components/shop/sort-select';
import { Pagination } from '@/components/shop/pagination';
import { EmptyState } from '@/components/shop/empty-state';
import { Reveal } from '@/components/motion';

/** Matches `REVALIDATE.catalogue`. Must be a literal - Next analyses it statically. */
export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [raw, settings, categories] = await Promise.all([
    searchParams,
    getSettings(),
    getCategories(),
  ]);
  const params = parseShopParams(raw);
  const shop = text(settings.business_info?.name);

  const category = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined;

  // The title reflects the actual filter, so a shared category link does not
  // arrive titled "Shop".
  const title = category ? category.name : params.search ? `Search: ${params.search}` : 'Shop';

  return {
    title,
    ...(shop ? { description: `Browse ${category?.name ?? 'every blend and spice'} from ${shop}.` } : {}),
    // A filtered or paged listing is not a canonical page of its own; letting
    // crawlers index every permutation is how a small catalogue turns into
    // thousands of near-duplicate URLs.
    ...(params.page > 1 || params.search ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = parseShopParams(raw);

  const [page, categories] = await Promise.all([
    getProducts(toApiQuery(params)),
    getCategories(),
  ]);

  const products = page?.items ?? [];
  const total = page?.total ?? 0;
  const totalPages = page?.totalPages ?? 0;

  const activeCategory = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined;

  return (
    <div className="shell py-12 sm:py-16">
      <Reveal>
        <header className="max-w-2xl">
          <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">
            {activeCategory?.name ?? 'The shelf'}
          </h1>
          {activeCategory?.description ? (
            <p className="mt-3 text-[17px] leading-relaxed text-ink-500">
              {activeCategory.description}
            </p>
          ) : null}
        </header>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_1fr]">
        {/* Sticky on desktop so the filter stays reachable down a long grid;
            static on mobile, where a sticky sidebar would eat the viewport. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CategoryFilter categories={categories} params={params} />
        </aside>

        <div>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-paper-300 pb-4">
            <p className="text-sm text-ink-500" data-numeric>
              {total === 0
                ? 'Nothing here'
                : `${total} ${total === 1 ? 'product' : 'products'}`}
              {params.search ? (
                <>
                  {' '}
                  matching <span className="text-ink-800">&ldquo;{params.search}&rdquo;</span>
                </>
              ) : null}
            </p>
            <SortSelect params={params} />
          </div>

          {products.length === 0 ? (
            <EmptyState
              title={
                page === null
                  ? 'The catalogue is unavailable'
                  : params.search
                    ? 'No products matched that search'
                    : 'Nothing in this category yet'
              }
              description={
                page === null
                  ? 'We could not reach the catalogue just now. Please try again shortly.'
                  : 'We grind to order, so the shelf changes. Try another category, or browse everything.'
              }
            />
          ) : (
            <>
              <ProductGrid products={products} priorityCount={4} />
              <Pagination params={params} totalPages={totalPages} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
