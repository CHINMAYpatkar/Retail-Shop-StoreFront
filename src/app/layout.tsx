import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { getSettings } from '@/lib/content';
import { SITE_URL } from '@/lib/config';
import { mediaUrl, text } from '@/lib/utils';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Providers } from './providers';
import './globals.css';

/**
 * Editorial serif for display, clean sans for body (ADR 0014).
 *
 * `next/font` self-hosts these at build time, so there is no request to Google
 * at runtime: no third-party connection on the critical path, no layout shift
 * from a late-arriving face, and nothing to leak a visitor's IP to a font CDN.
 *
 * `display: 'swap'` shows the fallback immediately rather than blocking on the
 * webfont. On a slow connection, readable text in Georgia beats invisible text
 * in Fraunces.
 */
const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  axes: ['SOFT', 'WONK'],
});

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const data = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--font-data',
});

/**
 * Metadata comes from admin settings, not from constants here.
 *
 * The shop name, description and social image are all editable in the admin
 * UI. Hardcoding a fallback title would be exactly the static content the
 * storefront is required not to have, so where a setting is missing the tag is
 * simply omitted and the browser falls back to the URL.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const business = settings.business_info ?? {};
  const seo = settings.seo_defaults ?? {};
  const branding = settings.branding ?? {};

  const name = text(seo.title) ?? text(business.name);
  const description = text(seo.description) ?? text(business.tagline);
  const ogImage = mediaUrl(seo.ogImageUrl);
  const favicon = mediaUrl(branding.faviconUrl);

  return {
    metadataBase: new URL(SITE_URL),
    ...(name ? { title: { default: name, template: `%s · ${name}` } } : {}),
    ...(description ? { description } : {}),
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    ...(favicon ? { icons: { icon: favicon } } : {}),
    openGraph: {
      type: 'website',
      url: SITE_URL,
      ...(name ? { siteName: name, title: name } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      ...(name ? { title: name } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched once here and passed down, rather than fetched again in the header
  // and the footer. Next dedupes identical `fetch` calls within a render, but
  // relying on that makes the data flow invisible to anyone reading it.
  const settings = await getSettings();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${data.variable}`}>
      <head>
        {/*
          Scroll-reveal content starts at opacity 0 and is made visible by
          JavaScript. Without this, a visitor with JavaScript disabled - or one
          whose bundle failed to load - would get a page that is blank below the
          fold, on a storefront whose entire job is to show products.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          {/* Keyboard users should not have to tab through the whole nav on
              every page to reach the content. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-paper-50"
          >
            Skip to content
          </a>

          <SiteHeader settings={settings} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter settings={settings} />
        </Providers>
      </body>
    </html>
  );
}
