import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Gauge } from 'lucide-react';
import { getRecipe } from '@/lib/content';
import { mediaUrl, text } from '@/lib/utils';
import { Media } from '@/components/ui/media';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { Reveal } from '@/components/motion';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) return { title: 'Recipe not found' };

  const image = mediaUrl(recipe.imageUrl);
  const description = text(recipe.description);

  return {
    title: recipe.name,
    ...(description ? { description } : {}),
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      type: 'article',
      title: recipe.name,
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function RecipePage({ params }: Params) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) notFound();

  // `steps` is a JSON column, so nothing about its shape is guaranteed by the
  // database. Anything that is not a usable object is dropped rather than
  // rendered as "undefined".
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.filter((step) => step && (text(step.title) || text(step.description)))
    : [];

  const ingredients = recipe.ingredients?.map((entry) => entry.ingredient) ?? [];
  const products = recipe.products?.map((entry) => entry.product) ?? [];

  return (
    <article className="shell py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Recipes', href: '/recipes' },
          { label: recipe.name },
        ]}
      />

      <Reveal className="mt-8 max-w-3xl">
        <h1 className="font-display text-display-sm leading-tight text-ink-900 sm:text-display-md">
          {recipe.name}
        </h1>

        {text(recipe.description) ? (
          <p className="mt-4 text-[17px] leading-relaxed text-ink-600">{recipe.description}</p>
        ) : null}

        {recipe.cookingTimeMins || text(recipe.difficulty) ? (
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-ink-500">
            {recipe.cookingTimeMins ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-ink-400" />
                {recipe.cookingTimeMins} mins
              </span>
            ) : null}
            {text(recipe.difficulty) ? (
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-ink-400" />
                {recipe.difficulty}
              </span>
            ) : null}
          </div>
        ) : null}
      </Reveal>

      {recipe.imageUrl ? (
        <Reveal delay={0.1} className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-paper-200">
          <Media src={recipe.imageUrl} alt="" priority sizes="100vw" />
        </Reveal>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem]">
        <div>
          {steps.length > 0 ? (
            <Reveal as="section">
              <h2 className="font-display text-2xl text-ink-900">Method</h2>
              <ol className="mt-6 space-y-8">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 font-data text-sm text-paper-50">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {text(step.title) ? (
                        <h3 className="font-display text-lg text-ink-900">{step.title}</h3>
                      ) : null}
                      {text(step.description) ? (
                        <p className="mt-1.5 leading-relaxed text-ink-600">{step.description}</p>
                      ) : null}
                      {step.imageUrl ? (
                        <div className="relative mt-4 aspect-[3/2] overflow-hidden rounded-md bg-paper-200">
                          <Media src={step.imageUrl} alt="" sizes="(min-width: 1024px) 50vw, 100vw" />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          ) : (
            <p className="text-ink-500">The method for this recipe has not been written up yet.</p>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {ingredients.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                Spices in this
              </h2>
              <ul className="mt-3 space-y-1.5">
                {ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    <Link
                      href={`/ingredients/${ingredient.slug}`}
                      className="text-sm text-ink-700 transition-colors hover:text-gold-700"
                    >
                      {ingredient.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                Make it with
              </h2>
              <ul className="mt-3 space-y-2">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop/${product.slug}`}
                      className="block rounded-md border border-paper-300 px-3.5 py-2.5 text-sm text-ink-800 transition-colors hover:border-ink-300 hover:text-gold-700"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
