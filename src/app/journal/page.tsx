import type { Metadata } from 'next';
import { getBlogPosts } from '@/lib/content';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ContentCard } from '@/components/content/content-card';
import { EmptyState } from '@/components/shop/empty-state';
import { Stagger, StaggerItem, Reveal } from '@/components/motion';
import { formatOrderDate } from '@/lib/format';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Notes on spices, grinding and cooking.',
  alternates: { canonical: '/journal' },
};

export default async function JournalPage() {
  const posts = await getBlogPosts();

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Journal' }]} />

      <Reveal className="mt-8 max-w-2xl">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">Journal</h1>
      </Reveal>

      <div className="mt-10">
        {posts.length === 0 ? (
          <EmptyState
            title="Nothing published yet"
            description="We write up what we learn as we grind. Check back."
            actionHref="/shop"
            actionLabel="Browse the shelf"
          />
        ) : (
          <Stagger className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <StaggerItem key={post.id}>
                <ContentCard
                  href={`/journal/${post.slug}`}
                  title={post.title}
                  description={post.excerpt}
                  imageUrl={post.coverImageUrl}
                  meta={post.publishedAt ? formatOrderDate(post.publishedAt) : null}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
