import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllProductSlugs, getProduct, getSettings } from '@/lib/content';
import { discountPercent, formatPrice, hasDiscount, mediaUrl, text } from '@/lib/utils';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductSpecs } from '@/components/product/product-specs';
import { ProductStructuredData } from '@/components/product/product-structured-data';
import { AddToCartPlaceholder } from '@/components/product/add-to-cart-placeholder';
import { RatingStars } from '@/components/product/rating-stars';
import { ReviewList } from '@/components/product/review-list';
import { Reveal } from '@/components/motion';

/** Matches `REVALIDATE.catalogue`. Must be a literal - Next analyses it statically. */
export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

/**
 * Prerenders every product known at build time, then revalidates on the window
 * above - the ISR behaviour ADR 0010 chose for the catalogue.
 *
 * `dynamicParams` stays at its default of true, so a product added after the
 * build is still served (rendered on demand, then cached).
 */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product not found' };

  const description = text(product.metaDescription) ?? text(product.shortDescription);
  const image = mediaUrl(product.images?.[0]?.url);

  return {
    title: text(product.metaTitle) ?? product.name,
    ...(description ? { description } : {}),
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="mt-16 border-t border-paper-300 pt-10">
      <h2 className="mb-5 font-display text-2xl text-ink-900">{heading}</h2>
      {children}
    </Reveal>
  );
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);

  // A slug that does not exist - or a product the admin deactivated or soft
  // deleted - must be a real 404. An empty page returning 200 would get
  // indexed as a valid product.
  if (!product) notFound();

  const outOfStock = product.stockQuantity <= 0;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const ingredients = product.ingredients?.map((entry) => entry.ingredient) ?? [];
  const recipes = product.recipes?.map((entry) => entry.recipe) ?? [];

  return (
    <article className="shell py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          ...(product.category
            ? [{ label: product.category.name, href: `/shop?category=${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div className="lg:pt-4">
          {product.category ? (
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-[11px] uppercase tracking-widest text-ink-400 transition-colors hover:text-gold-700"
            >
              {product.category.name}
            </Link>
          ) : null}

          <h1 className="mt-2 font-display text-display-sm leading-tight text-ink-900">
            {product.name}
          </h1>

          {product.ratingCount > 0 ? (
            <div className="mt-3">
              <RatingStars rating={product.ratingAverage} count={product.ratingCount} size="md" />
            </div>
          ) : null}

          {text(product.shortDescription) ? (
            <p className="mt-4 text-[17px] leading-relaxed text-ink-600">
              {product.shortDescription}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-baseline gap-3" data-numeric>
            <span className="font-data text-2xl font-medium text-ink-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount(product.price, product.compareAtPrice) ? (
              <>
                <span className="font-data text-base text-ink-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="rounded bg-chilli-400 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-paper-50">
                  {discount}% off
                </span>
              </>
            ) : null}
            {product.weightGrams ? (
              <span className="text-sm text-ink-400">for {product.weightGrams}g</span>
            ) : null}
          </div>

          <AddToCartPlaceholder outOfStock={outOfStock} />
          <ProductSpecs product={product} />
        </div>
      </div>

      {text(product.description) ? (
        <Section heading="About this blend">
          <p className="prose-shop whitespace-pre-line">{product.description}</p>
        </Section>
      ) : null}

      {text(product.preparationProcess) ? (
        <Section heading="How we make it">
          <p className="prose-shop whitespace-pre-line">{product.preparationProcess}</p>
        </Section>
      ) : null}

      {ingredients.length > 0 ? (
        <Section heading="What is in it">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ingredient) => (
              <li key={ingredient.id} className="rounded-lg border border-paper-300 p-4">
                <h3 className="font-display text-lg text-ink-900">{ingredient.name}</h3>
                {text(ingredient.description) ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {ingredient.description}
                  </p>
                ) : null}
                {text(ingredient.benefits) ? (
                  <p className="mt-2 text-sm leading-relaxed text-gold-800">
                    {ingredient.benefits}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {recipes.length > 0 ? (
        <Section heading="Cook with it">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="group block rounded-lg border border-paper-300 p-4 transition-colors hover:border-ink-300"
                >
                  <h3 className="font-display text-lg text-ink-900 transition-colors group-hover:text-gold-700">
                    {recipe.name}
                  </h3>
                  {text(recipe.description) ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">
                      {recipe.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section heading={product.ratingCount > 0 ? `Reviews (${product.ratingCount})` : 'Reviews'}>
        <ReviewList reviews={product.reviews ?? []} />
      </Section>

      <ProductStructuredData product={product} shopName={text(settings.business_info?.name)} />
    </article>
  );
}
