import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/content';
import { mediaUrl, text } from '@/lib/utils';
import { Media } from '@/components/ui/media';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { Reveal } from '@/components/motion';
import { formatOrderDate } from '@/lib/format';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: 'Not found' };

  const description = text(post.excerpt);
  const image = mediaUrl(post.coverImageUrl);

  return {
    title: post.title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      ...(description ? { description } : {}),
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function JournalPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // getBlogPost returns null for an unpublished post too, so unpublishing in
  // admin takes it off the storefront immediately.
  if (!post) notFound();

  return (
    <article className="shell py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Journal', href: '/journal' },
          { label: post.title },
        ]}
      />

      <Reveal className="mx-auto mt-8 max-w-prose">
        {post.publishedAt ? (
          <time dateTime={post.publishedAt} className="font-data text-xs text-ink-400">
            {formatOrderDate(post.publishedAt)}
          </time>
        ) : null}
        <h1 className="mt-2 font-display text-display-sm leading-tight text-ink-900">
          {post.title}
        </h1>
        {text(post.excerpt) ? (
          <p className="mt-4 text-[17px] leading-relaxed text-ink-500">{post.excerpt}</p>
        ) : null}
      </Reveal>

      {post.coverImageUrl ? (
        <Reveal delay={0.1} className="relative mx-auto mt-8 aspect-[16/9] max-w-3xl overflow-hidden rounded-lg bg-paper-200">
          <Media src={post.coverImageUrl} alt="" priority sizes="(min-width: 768px) 768px, 100vw" />
        </Reveal>
      ) : null}

      <Reveal delay={0.15} className="mx-auto mt-10">
        {/*
          Admin-authored HTML from our own authenticated CMS - the same trust
          level as the rest of the codebase, and written only by
          SUPER_ADMIN/ADMIN/MANAGER. If this ever accepts content from a less
          privileged source it needs sanitising first.
        */}
        <div className="prose-shop mx-auto" dangerouslySetInnerHTML={{ __html: post.content }} />
      </Reveal>
    </article>
  );
}
