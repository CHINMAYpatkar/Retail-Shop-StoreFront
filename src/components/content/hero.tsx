import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Banner } from '@/types/api';
import { Media } from '@/components/ui/media';
import { Parallax, Reveal } from '@/components/motion';
import { text } from '@/lib/utils';
import { HeroVideo } from './hero-video';

/**
 * The home hero, built from the first `HOME_HERO` banner.
 *
 * `imageUrl` is required by the schema and doubles as the poster frame, so
 * there is always something to show even when the video is missing, still
 * downloading, or blocked. The video layers over the image rather than
 * replacing it.
 *
 * Renders nothing when no hero banner exists. A shop that has not uploaded one
 * gets a page that starts at its first real section, which is a reasonable
 * page — not a grey box captioned "Hero image".
 */
export function Hero({ banner }: { banner?: Banner }) {
  if (!banner) return null;

  const title = text(banner.title);
  const subtitle = text(banner.subtitle);
  const ctaLabel = text(banner.ctaLabel);
  const ctaUrl = text(banner.ctaUrl);

  return (
    <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden bg-ink-900">
      <Parallax distance={80} className="absolute inset-0 -z-10">
        {/* -inset-y-8 gives the parallax somewhere to travel without exposing
            an edge at either end of the scroll. */}
        <div className="absolute -inset-y-8 inset-x-0">
          <Media
            src={banner.imageUrl}
            alt=""
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>
      </Parallax>

      {banner.videoUrl ? <HeroVideo src={banner.videoUrl} poster={banner.imageUrl} /> : null}

      {/*
        Scrim.

        Which photograph the admin uploads is not something we control, so the
        contrast behind the headline cannot be left to the image. The stops are
        explicit rather than an even gradient: the content is bottom-aligned, so
        the bottom 40% - where the text actually sits - is darkened enough to
        clear WCAG AA for body-size text on any image, while the top stays light
        enough that a photograph is still visible as a photograph.

        An even `via-ink-900/45` was measured at roughly 3.4:1 against the light
        placeholder. That squeaks past AA for the large headline and fails it for
        the subtitle, which is ordinary body size.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(26,22,20,0.92)_0%,rgba(26,22,20,0.74)_38%,rgba(26,22,20,0.34)_68%,rgba(26,22,20,0.12)_100%)]"
      />

      <div className="shell relative pb-16 pt-32 sm:pb-24">
        <div className="max-w-2xl">
          {title ? (
            <Reveal direction="up">
              <h1 className="font-display text-display-md leading-[1.05] text-paper-50 sm:text-display-lg">
                {title}
              </h1>
            </Reveal>
          ) : null}

          {subtitle ? (
            <Reveal direction="up" delay={0.12}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper-200">{subtitle}</p>
            </Reveal>
          ) : null}

          {ctaLabel && ctaUrl ? (
            <Reveal direction="up" delay={0.22}>
              <Link
                href={ctaUrl}
                className="group mt-8 inline-flex items-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-spice group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
