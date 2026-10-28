import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/content';
import { parseShopParams, toApiQuery } from '@/lib/shop-query';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { SearchForm } from '@/components/shop/search-form';
import { ProductGrid } from '@/components/product/product-grid';
import { EmptyState } from '@/components/shop/empty-state';

export const metadata: Metadata = {
  title: 'Search',
  // A search results page is not a canonical page worth indexing, and letting
  // crawlers index arbitrary queries is how a small catalogue sprouts thousands
  // of thin URLs.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const rawQuery = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const query = rawQuery?.trim() ?? '';

  // Reuses the shop page's validated parsing, so a hand-edited search URL is
  // sanitised the same way.
  const params = parseShopParams({ ...raw, search: query });
  const page = query ? await getProducts(toApiQuery(params)) : null;
  const products = page?.items ?? [];

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />

      <h1 className="mt-8 font-display text-display-sm text-ink-900">Search</h1>

      <div className="mt-6 max-w-xl">
        <Suspense fallback={<div className="h-14 animate-pulse rounded-md bg-paper-200" />}>
          <SearchForm initialQuery={query} />
        </Suspense>
      </div>

      <div className="mt-10">
        {!query ? (
          <p className="text-ink-500">Type above to search the shelf.</p>
        ) : products.length === 0 ? (
          <EmptyState
            title={`Nothing matched "${query}"`}
            description="We grind to order, so the shelf changes. Try a different word, or browse everything."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <>
            <p className="mb-8 text-sm text-ink-500" data-numeric>
              {page?.total} {page?.total === 1 ? 'result' : 'results'} for{' '}
              <span className="text-ink-800">&ldquo;{query}&rdquo;</span>
            </p>
            <ProductGrid products={products} priorityCount={4} />
          </>
        )}
      </div>
    </div>
  );
}
