import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCmsPage } from '@/lib/content';
import { text } from '@/lib/utils';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { Reveal } from '@/components/motion';

/**
 * Every CMS-backed page, on one route.
 *
 * `/about`, `/contact`, `/privacy`, `/terms`, `/refund-policy` and anything the
 * admin adds later all resolve here. A route file per page would mean a deploy
 * every time the shop wants a new page, which is exactly what the
 * no-static-content rule exists to avoid.
 *
 * The trade-off is that this catch-all sits at the root, so it competes with
 * every other top-level route. Next resolves static segments first, so `/shop`
 * and `/faqs` win over this; anything unmatched falls through to here, and a
 * slug with no CMS page behind it 404s properly.
 *
 * Content is admin-authored HTML, rendered through `.prose-shop` which styles
 * bare tags rather than classes we control.
 */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) return { title: 'Page not found' };

  const description = text(page.metaDescription);

  return {
    title: text(page.metaTitle) ?? page.title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function CmsContentPage({ params }: Params) {
  const { slug } = await params;
  const page = await getCmsPage(slug);

  // getCmsPage returns null for an unpublished page too, so unpublishing in
  // admin takes it off the storefront immediately rather than leaving a live
  // URL that is no longer meant to exist.
  if (!page) notFound();

  return (
    <article className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: page.title }]} />

      <Reveal className="mt-8">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">
          {page.title}
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        {/*
          Admin-authored HTML from our own authenticated CMS. Not customer
          input, and only SUPER_ADMIN/ADMIN/MANAGER can write it - the same
          trust level as the rest of the codebase. If this ever accepts content
          from a less privileged source it needs sanitising first.
        */}
        <div
          className="prose-shop"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </Reveal>
    </article>
  );
}
