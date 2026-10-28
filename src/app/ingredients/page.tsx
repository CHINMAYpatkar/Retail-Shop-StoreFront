import type { Metadata } from 'next';
import { getIngredients } from '@/lib/content';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ContentCard } from '@/components/content/content-card';
import { EmptyState } from '@/components/shop/empty-state';
import { Stagger, StaggerItem, Reveal } from '@/components/motion';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Our Spices',
  description: 'What goes into our blends, where it comes from, and what it does.',
  alternates: { canonical: '/ingredients' },
};

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Our Spices' }]} />

      <Reveal className="mt-8 max-w-2xl">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">
          Our spices
        </h1>
      </Reveal>

      <div className="mt-10">
        {ingredients.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="We are writing up what goes into each blend."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <Stagger className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {ingredients.map((ingredient) => (
              <StaggerItem key={ingredient.id}>
                <ContentCard
                  href={`/ingredients/${ingredient.slug}`}
                  title={ingredient.name}
                  description={ingredient.description}
                  imageUrl={ingredient.imageUrl}
                  aspect="square"
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
