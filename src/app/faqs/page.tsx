import type { Metadata } from 'next';
import { getFaqs } from '@/lib/content';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { Reveal } from '@/components/motion';
import { EmptyState } from '@/components/shop/empty-state';
import { FaqAccordion } from '@/components/content/faq-accordion';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Common questions about our spices, storage, delivery and returns.',
  alternates: { canonical: '/faqs' },
};

export default async function FaqsPage() {
  const faqs = await getFaqs();

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'FAQs' }]} />

      <Reveal className="mt-8 max-w-prose">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">
          Questions
        </h1>
      </Reveal>

      <div className="mt-10 max-w-prose">
        {faqs.length === 0 ? (
          <EmptyState
            title="No questions published yet"
            description="Get in touch and we will answer directly."
            actionHref="/contact"
            actionLabel="Contact us"
          />
        ) : (
          <FaqAccordion faqs={faqs} />
        )}
      </div>
    </div>
  );
}
