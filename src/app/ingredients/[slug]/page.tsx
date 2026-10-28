import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIngredient } from '@/lib/content';
import { mediaUrl, text } from '@/lib/utils';
import { Media } from '@/components/ui/media';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ProductGrid } from '@/components/product/product-grid';
import { Reveal } from '@/components/motion';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const ingredient = await getIngredient(slug);
  if (!ingredient) return { title: 'Not found' };

  const description = text(ingredient.description);
  const image = mediaUrl(ingredient.imageUrl);

  return {
    title: ingredient.name,
    ...(description ? { description } : {}),
    alternates: { canonical: `/ingredients/${ingredient.slug}` },
    openGraph: {
      type: 'article',
      title: ingredient.name,
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function IngredientPage({ params }: Params) {
  const { slug } = await params;
  const ingredient = await getIngredient(slug);
  if (!ingredient) notFound();

  const products = ingredient.products?.map((entry) => entry.product) ?? [];

  return (
    <article className="shell py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Our Spices', href: '/ingredients' },
          { label: ingredient.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative aspect-square overflow-hidden rounded-lg bg-paper-200">
          <Media src={ingredient.imageUrl} alt="" priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </Reveal>

        <Reveal delay={0.1} className="lg:pt-4">
          <h1 className="font-display text-display-sm leading-tight text-ink-900">
            {ingredient.name}
          </h1>

          {text(ingredient.description) ? (
            <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-ink-600">
              {ingredient.description}
            </p>
          ) : null}

          {text(ingredient.benefits) ? (
            <div className="mt-6 rounded-lg border-l-2 border-gold-300 bg-gold-50 px-5 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-800">
                What it does
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-700">
                {ingredient.benefits}
              </p>
            </div>
          ) : null}
        </Reveal>
      </div>

      {products.length > 0 ? (
        <Reveal as="section" className="mt-16 border-t border-paper-300 pt-10">
          <h2 className="mb-6 font-display text-2xl text-ink-900">Blends with {ingredient.name}</h2>
          <ProductGrid products={products} />
        </Reveal>
      ) : null}
    </article>
  );
}
