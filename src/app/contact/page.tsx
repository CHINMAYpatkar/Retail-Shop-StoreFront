import type { Metadata } from 'next';
import { getCmsPage, getSettings } from '@/lib/content';
import { text } from '@/lib/utils';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { ContactForm } from '@/components/content/contact-form';
import { Reveal } from '@/components/motion';

/**
 * Contact.
 *
 * A dedicated route rather than another CMS page, because this one needs a
 * form. Next resolves static segments before the `[slug]` catch-all, so this
 * wins for `/contact` while every other CMS page still falls through.
 *
 * The prose above the form is still the admin-authored `contact` CMS page — the
 * shop's words stay the shop's. Only the form is in code.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('contact');

  return {
    title: page?.title ?? 'Contact',
    ...(text(page?.metaDescription) ? { description: page!.metaDescription as string } : {}),
    alternates: { canonical: '/contact' },
  };
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getCmsPage('contact'), getSettings()]);
  const business = settings.business_info ?? {};

  const email = text(business.email);
  const phone = text(business.phone);
  const hours = text(business.hours);

  return (
    <div className="shell py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: page?.title ?? 'Contact' }]} />

      <Reveal className="mt-8">
        <h1 className="font-display text-display-sm text-ink-900 sm:text-display-md">
          {page?.title ?? 'Get in touch'}
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-prose">
          {page?.content ? (
            <Reveal delay={0.05}>
              {/*
                Admin-authored HTML from our own authenticated CMS - the same
                trust level as the rest of the codebase, written only by
                SUPER_ADMIN/ADMIN/MANAGER.
              */}
              <div className="prose-shop" dangerouslySetInnerHTML={{ __html: page.content }} />
            </Reveal>
          ) : null}

          <Reveal delay={0.1} className="mt-10">
            <h2 className="mb-5 font-display text-2xl text-ink-900">Send us a message</h2>
            <ContactForm />
          </Reveal>
        </div>

        {email || phone || hours ? (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-paper-300 bg-paper-50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                Or reach us directly
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {email ? (
                  <div>
                    <dt className="text-ink-400">Email</dt>
                    <dd className="mt-0.5">
                      <a href={`mailto:${email}`} className="text-ink-800 hover:text-gold-700">
                        {email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {phone ? (
                  <div>
                    <dt className="text-ink-400">Phone</dt>
                    <dd className="mt-0.5">
                      <a
                        href={`tel:${phone.replace(/\s+/g, '')}`}
                        className="font-data text-ink-800 hover:text-gold-700"
                      >
                        {phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {hours ? (
                  <div>
                    <dt className="text-ink-400">Hours</dt>
                    <dd className="mt-0.5 text-ink-800">{hours}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
