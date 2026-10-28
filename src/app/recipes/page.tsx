import type { Metadata } from 'next';
import { getRecipes } from '@/lib/content';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ContentCard } from '@/components/content/content-card';
import { EmptyState } from '@/components/shop/empty-state';
import { Stagger, StaggerItem, Reveal } from '@/components/motion';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'What to cook with our blends, and how.',
  alternates: { canonical: '/recipes' },
};

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Recipes' }]} />

      <Reveal className="mt-8 max-w-2xl">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">Recipes</h1>
      </Reveal>

      <div className="mt-10">
        {recipes.length === 0 ? (
          <EmptyState
            title="No recipes published yet"
            description="We are writing them up. In the meantime, the shelf is worth a look."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <Stagger className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <StaggerItem key={recipe.id}>
                <ContentCard
                  href={`/recipes/${recipe.slug}`}
                  title={recipe.name}
                  description={recipe.description}
                  imageUrl={recipe.imageUrl}
                  meta={
                    [recipe.difficulty, recipe.cookingTimeMins ? `${recipe.cookingTimeMins} mins` : null]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
