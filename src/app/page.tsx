import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getBanners, getFeaturedProducts, getSettings } from '@/lib/content';
import { section } from '@/lib/sections';
import { Hero } from '@/components/content/hero';
import { SectionHeading } from '@/components/content/section-heading';
import { UspStrip } from '@/components/content/usp-strip';
import { ProductGrid } from '@/components/product/product-grid';
import { Reveal } from '@/components/motion';

/**
 * The home page.
 *
 * Every heading, every line of copy, the hero and the promotional banner all
 * come from the API. There is no hardcoded marketing text anywhere in this
 * file — that is the requirement, and the test of it is that an admin can
 * change any word on this page without a deploy.
 *
 * Each block is skipped when its content is absent, so the page composes
 * itself from whatever exists. On a brand-new install it renders an empty but
 * structurally valid page rather than a wall of placeholders.
 */
/**
 * Must be a literal. Next statically analyses this export at build time and
 * cannot follow `REVALIDATE.catalogue` - it fails the build with "Unsupported
 * node type MemberExpression" rather than silently ignoring it.
 *
 * The individual `fetch` calls underneath still use the shared constants, so
 * this number only governs the page shell. Keep it equal to
 * `REVALIDATE.catalogue`.
 */
export const revalidate = 300;

export default async function HomePage() {
  // Fetched together: these are independent, and awaiting them in sequence
  // would make the page as slow as the sum of the three round trips.
  const [settings, heroBanners, featured] = await Promise.all([
    getSettings(),
    getBanners('HOME_HERO'),
    getFeaturedProducts(8),
  ]);

  const sections = settings.home_sections;
  const featuredSection = section(sections, 'featured');
  const storySection = section(sections, 'story');

  return (
    <>
      <Hero banner={heroBanners[0]} />

      <UspStrip strip={settings.usp_strip} />

      {featured.length > 0 && featuredSection ? (
        <section className="shell py-20 sm:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              heading={featuredSection.heading}
              subheading={featuredSection.subheading}
            />
            <Reveal delay={0.1}>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-1.5 text-sm text-gold-700 transition-colors hover:text-gold-800"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-spice group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <ProductGrid products={featured} priorityCount={4} />
        </section>
      ) : null}

      {storySection ? (
        <section className="border-t border-paper-300 bg-paper-50 py-20 sm:py-24">
          <div className="shell">
            <SectionHeading
              heading={storySection.heading}
              subheading={storySection.subheading}
              align="center"
            />
            <Reveal delay={0.15} className="mt-10 text-center">
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 rounded-md border border-ink-300 px-6 py-3 text-sm text-ink-800 transition-colors hover:border-ink-800 hover:bg-ink-900 hover:text-paper-50"
              >
                Read our story
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-spice group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
