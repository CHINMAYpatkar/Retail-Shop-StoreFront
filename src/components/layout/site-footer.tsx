import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { PublicSettings, SocialLinks } from '@/types/api';
import { text } from '@/lib/utils';
import { BrandMark } from './brand-mark';

/**
 * The footer, assembled almost entirely from settings (`SF-31`).
 *
 * Every column, link and line of copy comes from the `footer` and
 * `business_info` keys. Nothing here is written into the code except the
 * structure that holds it — and each block is skipped when its data is absent,
 * so an unconfigured shop gets a spare, tidy footer rather than a scaffold of
 * empty headings.
 *
 * The copyright year is computed rather than stored. A hardcoded year is wrong
 * every January, and nobody ever remembers to change it.
 */
export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const business = settings.business_info ?? {};
  const footer = settings.footer ?? {};
  const social = settings.social_links ?? {};

  const columns = (footer.columns ?? []).filter(
    (column) => text(column.heading) && (column.links?.length ?? 0) > 0,
  );

  const name = text(business.name);
  const tagline = text(business.tagline);
  const note = text(footer.note);
  const addressLines = (business.addressLines ?? []).map(text).filter(Boolean) as string[];
  const email = text(business.email);
  const phone = text(business.phone);

  const hasContact = addressLines.length > 0 || email || phone;

  return (
    <footer className="mt-24 border-t border-paper-300 bg-paper-200/60">
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <BrandMark branding={settings.branding} business={business} />
            {tagline ? (
              <p className="max-w-xs text-sm leading-relaxed text-ink-500">{tagline}</p>
            ) : null}
            <SocialRow social={social} />
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading as string}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-400">
                {column.heading}
              </h2>
              <ul className="space-y-2.5">
                {(column.links ?? [])
                  .filter((link) => text(link.label) && text(link.href))
                  .map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href as string}
                        className="text-sm text-ink-600 transition-colors hover:text-gold-700"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          ))}

          {hasContact ? (
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-400">
                Contact
              </h2>
              <address className="space-y-2.5 text-sm not-italic leading-relaxed text-ink-600">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {email ? (
                  <p>
                    <a href={`mailto:${email}`} className="hover:text-gold-700">
                      {email}
                    </a>
                  </p>
                ) : null}
                {phone ? (
                  <p>
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-gold-700">
                      {phone}
                    </a>
                  </p>
                ) : null}
              </address>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-paper-300 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()}
            {name ? ` ${name}` : ''}. All rights reserved.
          </p>
          {note ? <p className="sm:text-right">{note}</p> : null}
        </div>
      </div>
    </footer>
  );
}

/** Only renders the platforms the admin has actually filled in. */
function SocialRow({ social }: { social: SocialLinks }) {
  const links = [
    { key: 'instagram', href: text(social.instagram), Icon: Instagram, label: 'Instagram' },
    { key: 'facebook', href: text(social.facebook), Icon: Facebook, label: 'Facebook' },
    { key: 'youtube', href: text(social.youtube), Icon: Youtube, label: 'YouTube' },
  ].filter((link) => link.href);

  if (links.length === 0) return null;

  return (
    <ul className="flex items-center gap-1.5">
      {links.map(({ key, href, Icon, label }) => (
        <li key={key}>
          <a
            href={href as string}
            target="_blank"
            // noreferrer alongside noopener: the tab-nabbing protection plus not
            // leaking the customer's current page to the destination.
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-paper-300 hover:text-ink-800"
          >
            <Icon className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
